#!/bin/bash

# Function to display menu and get user choices
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

# Function to check if asdf plugin is supported
has_asdf_plugin() {
  local plugin="$1"
  case "$plugin" in
    nodejs|python|golang|rust) echo "true" ;;
    *) echo "false" ;;
  esac
}

# Function to build and install the VS Code extension
build_extension() {
  echo "🔨 Building the Roo Code extension..."
  cd ..
  mkdir -p bin
  npm run install-extension -- --silent --no-audit || exit 1
  npm run install-webview -- --silent --no-audit || exit 1
  npm run install-e2e -- --silent --no-audit || exit 1
  npx vsce package --out bin/roo-code-latest.vsix || exit 1
  code --install-extension bin/roo-code-latest.vsix || exit 1
  cd evals
}

# --- OS Check ---
if [[ "$(uname -s)" != "Linux" ]]; then
  echo "⚠️ This script is intended for Linux only."
  exit 1
fi

# --- Architecture Check (for informational purposes, as asdf handles most) ---
ARCH=$(uname -m)
echo "Detected architecture: $ARCH"

# --- Language options ---
options=("nodejs" "python" "golang" "rust" "java")
binaries=("node" "python" "go" "rustc" "javac")

for i in "${!options[@]}"; do
  choices[i]="*"
done

prompt="Type 1-5 to select, 'q' to quit, ⏎ to continue: "

while menu && read -rp "$prompt" num && [[ "$num" ]]; do
  [[ "$num" == "q" ]] && exit 0

  [[ "$num" != *[![:digit:]]* ]] &&
    ((num > 0 && num <= ${#options[@]})) ||
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

# --- Install common dependencies for Linux ---

# Install git if not present
if ! command -v git &>/dev/null; then
  echo "📦 Installing git..."
  if command -v apt &>/dev/null; then
    sudo apt update && sudo apt install -y git || exit 1
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y git || exit 1
  elif command -v yum &>/dev/null; then
    sudo yum install -y git || exit 1
  else
    echo "⚠️ Could not find apt, dnf, or yum. Please install git manually."
    exit 1
  fi
  echo "✅ Git installed."
fi

# Install asdf
if command -v asdf &>/dev/null; then
  ASDF_VERSION=$(asdf --version)
  echo "✅ asdf is installed ($ASDF_VERSION)"
  # Ensure asdf is sourced for the current session
  . "$HOME/.asdf/asdf.sh"
  . "$HOME/.asdf/completions/asdf.bash"
elif [[ -d "$HOME/.asdf" ]]; then
  echo "⚠️ asdf directory found but command not in PATH. Sourcing asdf..."
  . "$HOME/.asdf/asdf.sh"
  . "$HOME/.asdf/completions/asdf.bash"
  ASDF_VERSION=$(asdf --version)
  echo "✅ asdf is now sourced ($ASDF_VERSION)"
else
  read -p "🛠️ asdf (https://asdf-vm.com) is required. Install it? (Y/n): " install_asdf

  if [[ "$install_asdf" =~ ^[Yy]|^$ ]]; then
    echo "🛠️ Installing asdf..."
    git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.0 || exit 1
    
    # Add asdf to shell profile
    if [[ "$SHELL" == "/bin/zsh" ]] && ! grep -q '. "$HOME/.asdf/asdf.sh"' ~/.zshrc; then
      echo -e '\n. "$HOME/.asdf/asdf.sh"' >> ~/.zshrc
      echo -e '. "$HOME/.asdf/completions/asdf.bash"' >> ~/.zshrc
    elif [[ "$SHELL" == "/bin/bash" ]] && ! grep -q '. "$HOME/.asdf/asdf.sh"' ~/.bashrc; then
      echo -e '\n. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc
      echo -e '. "$HOME/.asdf/completions/asdf.bash"' >> ~/.bashrc
    else
      echo "⚠️ Could not automatically add asdf to your shell profile. Please add the following lines to your shell's rc file (e.g., ~/.bashrc or ~/.zshrc):"
      echo '. "$HOME/.asdf/asdf.sh"'
      echo '. "$HOME/.asdf/completions/asdf.bash"'
    fi
    
    # Source asdf for current session
    . "$HOME/.asdf/asdf.sh"
    . "$HOME/.asdf/completions/asdf.bash"

    ASDF_VERSION=$(asdf --version)
    echo "✅ asdf is installed ($ASDF_VERSION)"
  else
    exit 1
  fi
fi

# Install GitHub CLI
if ! command -v gh &>/dev/null; then
  read -p "👨‍💻 GitHub cli is needed to submit evals results. Install it? (Y/n): " install_gh

  if [[ "$install_gh" =~ ^[Yy]|^$ ]]; then
    echo "📦 Installing GitHub CLI..."
    type -p curl >/dev/null || (sudo apt update && sudo apt install curl -y)
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && sudo chmod go+rx /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && sudo apt update \
    && sudo apt install gh -y || exit 1
    GH_VERSION=$(gh --version | head -n 1)
    echo "✅ gh is installed ($GH_VERSION)"
    gh auth status || gh auth login -w -p https
  fi
else
  GH_VERSION=$(gh --version | head -n 1)
  echo "✅ gh is installed ($GH_VERSION)"
fi

# Install pnpm
if ! command -v pnpm &>/dev/null; then
  read -p "📦 pnpm is required. Install it? (Y/n): " install_pnpm
  if [[ "$install_pnpm" =~ ^[Yy]|^$ ]]; then
    echo "📦 Installing pnpm..."
    if command -v npm &>/dev/null; then
      npm install -g pnpm || exit 1
    else
      # Fallback to direct curl install if npm is not available
      curl -fsSL https://get.pnpm.io/install.sh | sh - || exit 1
      echo "⚠️ pnpm installed via curl. You might need to restart your terminal or source your shell profile for pnpm to be in PATH."
    fi
    PNPM_VERSION=$(pnpm --version)
    echo "✅ pnpm is installed ($PNPM_VERSION)"
  else
    exit 1
  fi
  # Source pnpm for current session
  if [[ -f "$HOME/.local/share/pnpm/setup.sh" ]]; then
    source "$HOME/.local/share/pnpm/setup.sh" || { echo "❌ Failed to source pnpm setup script."; exit 1; }
  fi
else
  PNPM_VERSION=$(pnpm --version)
  echo "✅ pnpm is installed ($PNPM_VERSION)"
  # Ensure pnpm is sourced for the current session if it was already installed
  if [[ -f "$HOME/.local/share/pnpm/setup.sh" ]]; then
    source "$HOME/.local/share/pnpm/setup.sh" || { echo "❌ Failed to source pnpm setup script."; exit 1; }
  fi
fi

# Install VS Code
if ! command -v code &>/dev/null; then
  read -p "💻 Visual Studio Code is required. Install it? (Y/n): " install_vscode
  if [[ "$install_vscode" =~ ^[Yy]|^$ ]]; then
    echo "💻 Installing Visual Studio Code..."
    if command -v apt &>/dev/null; then
      sudo apt update
      sudo apt install -y software-properties-common apt-transport-https wget
      wget -q https://packages.microsoft.com/keys/microsoft.asc -O- | sudo apt-key add -
      sudo add-apt-repository "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main"
      sudo apt update
      sudo apt install -y code || exit 1
    elif command -v dnf &>/dev/null; then
      sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
      sudo sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'
      sudo dnf check-update
      sudo dnf install -y code || exit 1
    else
      echo "⚠️ Could not find apt or dnf. Please install Visual Studio Code manually from https://code.visualstudio.com/download"
      exit 1
    fi
    VSCODE_VERSION=$(code --version | head -n 1)
    echo "✅ Visual Studio Code is installed ($VSCODE_VERSION)"
  else
    exit 1
  fi
else
  VSCODE_VERSION=$(code --version | head -n 1)
  echo "✅ Visual Studio Code is installed ($VSCODE_VERSION)"
fi

# --- Install selected language runtimes via asdf or package manager ---
for i in "${!options[@]}"; do
  [[ "${choices[i]}" ]] || continue

  plugin="${options[$i]}"
  binary="${binaries[$i]}"

  if [[ "$(has_asdf_plugin "$plugin")" == "true" ]]; then
    if ! asdf plugin list | grep -q "^${plugin}$"; then
      echo "📦 Installing ${plugin} asdf plugin..."
      asdf plugin add "${plugin}" || exit 1
      echo "✅ asdf ${plugin} plugin installed successfully"
    fi
  fi

  case "${plugin}" in
  "nodejs")
    if ! command -v node &>/dev/null || [[ $(node --version) != "v20.18.1" ]]; then
      echo "📦 Installing Node.js 20.18.1 via asdf..."
      asdf install nodejs 20.18.1 || exit 1
      asdf global nodejs 20.18.1 || exit 1 # Use global for consistency
      NODE_VERSION=$(node --version)
      echo "✅ Node.js is installed ($NODE_VERSION)"
    else
      NODE_VERSION=$(node --version)
      echo "✅ Node.js is installed ($NODE_VERSION)"
    fi
    ;;

  "python")
    if ! command -v python &>/dev/null || [[ $(python --version 2>&1) != *"Python 3.13.2"* ]]; then
      echo "📦 Installing Python build dependencies..."
      if command -v apt &>/dev/null; then
        sudo apt update && sudo apt install -y build-essential libssl-dev zlib1g-dev \
        libbz2-dev libreadline-dev libsqlite3-dev libncursesw5-dev libffi-dev tk-dev \
        libxml2-dev libxmlsec1-dev liblzma-dev || exit 1
      elif command -v dnf &>/dev/null; then
        sudo dnf install -y @development-tools openssl-devel zlib-devel bzip2-devel \
        readline-devel sqlite-devel ncurses-devel libffi-devel tk-devel xz-devel || exit 1
      elif command -v yum &>/dev/null; then
        sudo yum install -y @development openssl-devel zlib-devel bzip2-devel \
        readline-devel sqlite-devel ncurses-devel libffi-devel tk-devel xz-devel || exit 1
      else
        echo "⚠️ Could not find apt, dnf, or yum. Please install Python build dependencies manually."
        exit 1
      fi
      echo "✅ Python build dependencies installed."

      echo "📦 Installing Python 3.13.2 via asdf..."
      asdf install python 3.13.2 || exit 1
      asdf global python 3.13.2 || exit 1 # Use global for consistency
      PYTHON_VERSION=$(python --version)
      echo "✅ Python is installed ($PYTHON_VERSION)"
    else
      PYTHON_VERSION=$(python --version)
      echo "✅ Python is installed ($PYTHON_VERSION)"
    fi

    if ! command -v uv &>/dev/null; then
      read -p "📦 uv (https://github.com/astral-sh/uv) is recommended for Python package management. Install it? (Y/n): " install_uv
      if [[ "$install_uv" =~ ^[Yy]|^$ ]]; then
        echo "📦 Installing uv..."
        if command -v pipx &>/dev/null; then
          pipx install uv || exit 1
        else
          echo "⚠️ pipx not found. Attempting direct install. Ensure ~/.cargo/bin is in your PATH if you installed Rust."
          curl -LsSf https://astral.sh/uv/install.sh | sh || exit 1
        fi
        UV_VERSION=$(uv --version)
        echo "✅ uv is installed ($UV_VERSION)"
      fi
    else
      UV_VERSION=$(uv --version)
      echo "✅ uv is installed ($UV_VERSION)"
    fi
    ;;

  "golang")
    if ! command -v go &>/dev/null || [[ $(go version) != *"go1.24.2"* ]]; then
      echo "📦 Installing Go 1.24.2 via asdf..."
      asdf install golang 1.24.2 || exit 1
      asdf global golang 1.24.2 || exit 1 # Use global for consistency
      GO_VERSION=$(go version)
      echo "✅ Go is installed ($GO_VERSION)"
    else
      GO_VERSION=$(go version)
      echo "✅ Go is installed ($GO_VERSION)"
    fi
    ;;

  "rust")
    if ! command -v rustc &>/dev/null || [[ $(rustc --version) != *"rustc 1.85.1"* ]]; then
      echo "📦 Installing Rust 1.85.1 via asdf..."
      asdf install rust 1.85.1 || exit 1
      asdf global rust 1.85.1 || exit 1 # Use global for consistency
      RUST_VERSION=$(rustc --version)
      echo "✅ Rust is installed ($RUST_VERSION)"
    else
      RUST_VERSION=$(rustc --version)
      echo "✅ Rust is installed ($RUST_VERSION)"
    fi
    ;;

  "java")
    if ! command -v javac &>/dev/null || ! javac --version &>/dev/null; then
      read -p "☕ Java (OpenJDK 17) is required. Install it? (Y/n): " install_java
      if [[ "$install_java" =~ ^[Yy]|^$ ]]; then
        echo "☕ Installing OpenJDK 17..."
        if command -v apt &>/dev/null; then
          sudo apt update && sudo apt install -y openjdk-17-jdk || exit 1
        elif command -v dnf &>/dev/null; then
          sudo dnf install -y java-17-openjdk || exit 1
        elif command -v yum &>/dev/null; then
          sudo yum install -y java-17-openjdk || exit 1
        else
          echo "⚠️ Could not find apt, dnf, or yum. Please install OpenJDK 17 manually."
          exit 1
        fi
        JAVA_VERSION=$(javac --version | head -n 1)
        echo "✅ Java is installed ($JAVA_VERSION)"
      else
        exit 1
      fi
    else
      JAVA_VERSION=$(javac --version | head -n 1)
      echo "✅ Java is installed ($JAVA_VERSION)"
    fi
    ;;
  esac
done

# --- Install pnpm dependencies ---
echo "📦 Installing pnpm dependencies..."
pnpm install --silent || exit 1

# --- Install VS Code extensions ---
echo -n "🔌 Installing Visual Studio Code extensions... "
code --install-extension golang.go &>/dev/null || exit 1
code --install-extension dbaeumer.vscode-eslint&>/dev/null || exit 1
code --install-extension redhat.java &>/dev/null || exit 1
code --install-extension ms-python.python&>/dev/null || exit 1
code --install-extension rust-lang.rust-analyzer &>/dev/null || exit 1

if ! code --list-extensions 2>/dev/null | grep -q "rooveterinaryinc.roo-cline"; then
  code --install-extension rooveterinaryinc.roo-cline &>/dev/null || exit 1
fi

echo "✅ Done"

# --- Clone/Update evals repository ---
if [[ ! -d "../../evals" ]]; then
  echo -n "🔗 Cloning evals repository... "

  if gh auth status &>/dev/null; then
    gh repo clone cte/evals ../../evals || exit 1
  else
    git clone https://github.com/cte/evals.git ../../evals || exit 1
  fi

  echo "✅ Done"
else
  echo -n "🔄 Updating evals repository... "

  (cd ../../evals && \
    git checkout -f &>/dev/null && \
    git clean -f -d &>/dev/null && \
    git checkout main &>/dev/null && \
    git pull &>/dev/null) || { echo "❌ Failed to update evals repository."; exit 1; }

  echo "✅ Done"
fi

# --- Setup .env file ---
if [[ ! -s .env ]]; then
  cp .env.sample .env || exit 1
fi

# --- Sync database ---
echo -n "🗄️ Syncing Roo Code evals database... "
pnpm --filter @evals/db db:push &>/dev/null || exit 1
pnpm --filter @evals/db db:enable-wal &>/dev/null || exit 1
echo "✅ Done"

# --- Configure OpenRouter API Key ---
if ! grep -q "OPENROUTER_API_KEY" .env; then
  read -p "🔐 Enter your OpenRouter API key (sk-or-v1-...): " openrouter_api_key
  echo "🔑 Validating..."
  curl --silent --fail https://openrouter.ai/api/v1/key -H "Authorization: Bearer $openrouter_api_key" &>/dev/null || exit 1
  echo "OPENROUTER_API_KEY=$openrouter_api_key" >> .env || exit 1
fi

# --- Build Roo Code extension ---
current_version=$(code --list-extensions --show-versions 2>/dev/null | grep roo)
read -p "💻 Do you want to build a new version of the Roo Code extension? [currently $current_version] (y/N): " build_extension_choice

if [[ "$build_extension_choice" =~ ^[Yy]$ ]]; then
  build_extension
fi

echo -e "\n🚀 You're ready to rock and roll! \n"

# --- Start web app ---
if ! nc -z localhost 3000; then
  read -p "🌐 Would you like to start the evals web app? (Y/n): " start_evals

  if [[ "$start_evals" =~ ^[Yy]|^$ ]]; then
    pnpm web
  else
    echo "💡 You can start it anytime with 'pnpm web'."
  fi
else
  echo "👟 The evals web app is running at http://localhost:3000"
fi