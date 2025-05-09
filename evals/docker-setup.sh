#!/bin/bash

# Docker Setup Script for Roo Code Evals
# This script sets up the Docker environment for running Roo Code Evals

set -e

# Enable Docker Compose Bake for better performance
export COMPOSE_BAKE=true

# Detect architecture
if [[ "$(uname -m)" == "arm64" ]] || [[ "$(uname -m)" == "aarch64" ]]; then
    export TARGETARCH="arm64"
    echo "🖥️ Detected ARM64 architecture"
else
    export TARGETARCH="amd64"
    echo "🖥️ Detected AMD64 architecture"
fi

# Add architecture to .env.docker
echo "TARGETARCH=$TARGETARCH" >> .env.docker

# Language selection menu
menu() {
  echo -e "\n📋 Which eval types would you like to support?\n"

  for i in ${!options[@]}; do
    printf " %d) %-6s [%s]" $((i + 1)) "${options[i]}" "${choices[i]:- }"

    if [[ $i == 0 ]]; then
      printf " (required)"
    fi

    printf "\n"
  done

  echo -e " q) quit\n"
}

options=("nodejs" "python" "golang" "rust" "java")

for i in "${!options[@]}"; do
  choices[i]="*"
done

prompt="Type 1-5 to select, 'q' to quit, ⏎ to continue: "

while menu && read -rp "$prompt" num && [[ "$num" ]]; do
  [[ "$num" == "q" ]] && exit 0

  [[ "$num" != *[![:digit:]]* ]] &&
    ((num > 1 && num <= ${#options[@]})) ||
    {
      continue
    }

  ((num--))
  [[ "${choices[num]}" ]] && choices[num]="" || choices[num]="*"
done

empty=true

for i in ${!options[@]}; do
  [[ "${choices[i]}" ]] && {
    empty=false
    break
  }
done

[[ "$empty" == true ]] && exit 0

printf "\n"

# Create a .env file with selected languages
echo "# Selected languages" > .env.docker
for i in ${!options[@]}; do
  if [[ "${choices[i]}" ]]; then
    echo "ENABLE_${options[i]^^}=true" >> .env.docker
  else
    echo "ENABLE_${options[i]^^}=false" >> .env.docker
  fi
done

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p data

# Check if .env file exists, create it if not
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.sample .env
    
    # Ask for OpenRouter API key
    read -p "🔐 Enter your OpenRouter API key (sk-or-v1-...): " openrouter_api_key
    
    if [ -n "$openrouter_api_key" ]; then
        echo "OPENROUTER_API_KEY=$openrouter_api_key" >> .env
    else
        echo "⚠️ No API key provided. You'll need to add it to .env manually."
    fi
fi

# Determine host IP for Docker networking
if [[ "$(uname -s)" == "Darwin" ]]; then
    # macOS
    HOST_IP="host.docker.internal"
elif [[ "$(uname -s)" == "Linux" ]]; then
    # Linux
    HOST_IP=$(ip -4 addr show docker0 | grep -Po 'inet \K[\d.]+')
    if [ -z "$HOST_IP" ]; then
        HOST_IP=$(hostname -I | awk '{print $1}')
    fi
else
    # Windows or other
    HOST_IP="host.docker.internal"
fi

echo "HOST_IP=$HOST_IP" >> .env

# Load the language selection environment variables from .env.docker
if [ -f .env.docker ]; then
  echo "Loading language selections from .env.docker"
  export $(grep -v '^#' .env.docker | xargs)
fi

# Clone the evals repository if it doesn't exist
if [ ! -d "../../evals" ]; then
    echo "🔗 Cloning evals repository..."
    
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        gh repo clone cte/evals ../../evals
    else
        git clone https://github.com/cte/evals.git ../../evals
    fi
    
    echo "✅ Evals repository cloned successfully"
else
    echo "✅ Evals repository already exists"
fi

# Build the base image
echo "🔨 Building base Docker image for $TARGETARCH architecture..."
docker-compose build --build-arg TARGETARCH=$TARGETARCH base

# Build the other images
echo "🔨 Building Docker images for $TARGETARCH architecture..."
docker-compose build --build-arg TARGETARCH=$TARGETARCH orchestrator task

# Build the web image separately to handle potential failures
echo "🔨 Building web image for $TARGETARCH architecture..."
docker-compose build --build-arg TARGETARCH=$TARGETARCH web || {
    echo "⚠️ Web image build failed, but we can still proceed with development mode"
    echo "The web app will be built when started in development mode"
}

# Make the build-extension script executable
chmod +x docker/build-extension.sh

# Ask if the user wants to build the Roo Code extension
read -p "💻 Do you want to build a new version of the Roo Code extension? (y/N): " build_extension

if [[ "$build_extension" =~ ^[Yy]$ ]]; then
    echo "🔨 Building the Roo Code extension..."
    docker run --rm -v "$(pwd)/..:/roo-code" -v "$(pwd)/docker/build-extension.sh:/build-extension.sh" roo-code-evals-base:latest bash /build-extension.sh
fi

# Set up the database
echo -n "🗄️ Setting up the database... "
mkdir -p data

# Create a temporary .env file for the database setup
echo "BENCHMARKS_DB_PATH=file:///app/data/evals.db" > .env.db

if [ ! -f "data/evals.db" ]; then
    # Initialize the database
    docker-compose run --rm -e BENCHMARKS_DB_PATH="file:///app/data/evals.db" orchestrator pnpm --filter @evals/db db:push
    docker-compose run --rm -e BENCHMARKS_DB_PATH="file:///app/data/evals.db" orchestrator pnpm --filter @evals/db db:enable-wal
    echo "✅ Done"
else
    echo "✅ Database already exists"
fi

# Check for OpenRouter API key
if ! grep -q "OPENROUTER_API_KEY" .env; then
    read -p "🔐 Enter your OpenRouter API key (sk-or-v1-...): " openrouter_api_key
    echo "🔑 Validating..."
    
    # Validate the API key
    if curl --silent --fail https://openrouter.ai/api/v1/key -H "Authorization: Bearer $openrouter_api_key" &>/dev/null; then
        echo "OPENROUTER_API_KEY=$openrouter_api_key" >> .env
        echo "✅ API key validated and saved"
    else
        echo "❌ Invalid API key"
        exit 1
    fi
fi

# Remove any existing network with the same name to avoid conflicts
if docker network ls | grep -q evals_evals-network; then
    echo "🌐 Removing existing Docker network..."
    docker network rm evals_evals-network || true
fi

# Let docker-compose create the network
echo "🌐 Network will be created by docker-compose..."

# Ask if the user wants to start the system
read -p "🌐 Would you like to start the evals system now? (Y/n): " start_evals

if [[ "$start_evals" =~ ^[Yy]|^$ ]]; then
    echo "🚀 Starting the evals system..."
    docker-compose up -d
    echo "✅ System started"
    echo "📊 Web interface: http://localhost:3000"
else
    echo -e "\n🚀 Docker setup complete! You can now run the evals system with:"
    echo "docker-compose up"
    echo -e "\nTo access the web interface, open http://localhost:3000 in your browser."
    echo -e "\nTo run a specific task, use:"
    echo "docker-compose exec orchestrator pnpm cli run <language> <exercise>"
    echo -e "\nTo stop the system:"
    echo "docker-compose down"
fi