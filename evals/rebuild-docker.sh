#!/bin/bash

# Script to rebuild Docker images with proper architecture detection
# This is useful when you need to rebuild the images after making changes

set -e

# Detect architecture
if [[ "$(uname -m)" == "arm64" ]] || [[ "$(uname -m)" == "aarch64" ]]; then
    export TARGETARCH="arm64"
    echo "🖥️ Detected ARM64 architecture"
else
    export TARGETARCH="amd64"
    echo "🖥️ Detected AMD64 architecture"
fi

# Enable Docker Compose Bake for better performance
export COMPOSE_BAKE=true

# Load environment variables
if [ -f .env.docker ]; then
    echo "Loading environment from .env.docker"
    export $(grep -v '^#' .env.docker | xargs)
fi

# Ask which images to rebuild
echo -e "\n📋 Which images would you like to rebuild?\n"
options=("base" "orchestrator" "web" "task" "all")
choices=()

for i in "${!options[@]}"; do
    if [[ "${options[$i]}" == "all" ]]; then
        printf " %d) %-12s [%s]\n" $((i + 1)) "${options[i]}" " "
    else
        printf " %d) %-12s [%s]\n" $((i + 1)) "${options[i]}" " "
    fi
done

echo -e " q) quit\n"

read -p "Select options (e.g., '1 3' for base and web, '5' for all): " selection

if [[ "$selection" == "q" ]]; then
    exit 0
fi

if [[ "$selection" == *"5"* ]]; then
    # Rebuild all images
    echo "🔨 Rebuilding all Docker images for $TARGETARCH architecture..."
    docker-compose build --no-cache --build-arg TARGETARCH=$TARGETARCH
else
    # Rebuild selected images
    for num in $selection; do
        if [[ "$num" =~ ^[1-4]$ ]]; then
            image="${options[$((num-1))]}"
            echo "🔨 Rebuilding $image image for $TARGETARCH architecture..."
            docker-compose build --no-cache --build-arg TARGETARCH=$TARGETARCH $image
        fi
    done
fi

echo "✅ Rebuild complete!"

# Ask if the user wants to restart the containers
read -p "🔄 Would you like to restart the containers? (y/N): " restart

if [[ "$restart" =~ ^[Yy]$ ]]; then
    echo "🔄 Restarting containers..."
    docker-compose down
    docker-compose up -d
    echo "✅ Containers restarted!"
fi