#!/bin/bash
#
# LAhe Installation Script
# Automates dependency installation, Ollama setup, and service initialization
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo ""
    echo -e "${BLUE}"
    echo "  _   _     _             _   _          _   "
    echo " | \ | |   | |           | | (_)        | |  "
    echo " |  \| |___| |_ _ __ ___ | |_ _  ___  __| | "
    echo " | . \` / __| __| '__/ _ \| __| |/ __|/ _\` |"
    echo " | |\  \__ \ |_| | | (_) | |_| | (__| (_| |"
    echo " |_| \_|___/\__|_|  \___/ \__|_|\___|\__,_|"
    echo ""
    echo -e "${NC}           Local Arch Helper v1.0"
    echo ""
}

check_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        log_info "Detected Linux system"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        log_info "Detected macOS system"
    else
        log_warn "Unknown OS: $OSTYPE. Some features may not work."
        OS="unknown"
    fi
}

check_node() {
    log_info "Checking Node.js installation..."

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')

        if [ "$MAJOR_VERSION" -lt 20 ]; then
            log_error "Node.js version $NODE_VERSION is too old (requires 20+)"
            log_info "Please install Node.js 20 or higher: https://nodejs.org/"
            exit 1
        fi

        log_success "Node.js $NODE_VERSION found"
    else
        log_error "Node.js not found"
        log_info "Please install Node.js 20 or higher: https://nodejs.org/"
        exit 1
    fi
}

check_npm() {
    log_info "Checking npm installation..."

    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        log_success "npm $NPM_VERSION found"
    else
        log_error "npm not found"
        exit 1
    fi
}

check_ollama() {
    log_info "Checking Ollama installation..."

    if command -v ollama &> /dev/null; then
        OLLAMA_VERSION=$(ollama --version 2>/dev/null || echo "unknown")
        log_success "Ollama $OLLAMA_VERSION found"

        # Check if Ollama is running
        if curl -s http://localhost:11434/api/tags &> /dev/null; then
            log_success "Ollama service is running"
            OLLAMA_RUNNING=true
        else
            log_warn "Ollama is installed but not running"
            OLLAMA_RUNNING=false
        fi
    else
        log_warn "Ollama not found"
        log_info "Ollama is required for AI features"
        log_info "Install it from: https://ollama.com/download"
        read -p "Do you want to install Ollama now? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_ollama
        else
            log_info "Skipping Ollama installation"
            OLLAMA_RUNNING=false
        fi
    fi
}

install_ollama() {
    log_info "Installing Ollama..."

    if [[ "$OS" == "linux" ]]; then
        curl -fsSL https://ollama.com/install.sh | sh
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install ollama
        else
            log_error "Homebrew not found. Please install Homebrew first."
            log_info "Visit: https://brew.sh/"
            return 1
        fi
    else
        log_error "Unsupported OS for automatic Ollama installation"
        log_info "Please install Ollama manually: https://ollama.com/download"
        return 1
    fi

    if command -v ollama &> /dev/null; then
        log_success "Ollama installed successfully"
        OLLAMA_RUNNING=false
    else
        log_error "Ollama installation failed"
        return 1
    fi
}

install_dependencies() {
    log_info "Installing project dependencies..."

    if [ -f "package-lock.json" ]; then
        npm ci --silent
    else
        npm install --silent
    fi

    log_success "Dependencies installed"
}

check_model() {
    if ! command -v ollama &> /dev/null; then
        return
    fi

    log_info "Checking for installed Ollama models..."

    MODELS=$(ollama list 2>/dev/null | grep -v "NAME" | awk '{print $1}' || echo "")

    if [ -z "$MODELS" ]; then
        log_warn "No Ollama models found"

        DEFAULT_MODEL="qwen3.5:0.8b"
        log_info "Recommended model: $DEFAULT_MODEL (~500MB)"

        read -p "Do you want to download $DEFAULT_MODEL now? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Downloading $DEFAULT_MODEL..."
            ollama pull $DEFAULT_MODEL
            log_success "Model downloaded successfully"
        fi
    else
        log_success "Found models: $MODELS"
    fi
}

create_env_file() {
    if [ ! -f ".env.local" ]; then
        log_info "Creating .env.local from .env.example..."

        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            log_success ".env.local created"
        else
            log_error ".env.example not found"
            log_warn "Creating minimal .env.local..."

            cat > .env.local << EOF
# Ollama Configuration
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen3.5:0.8b"

# App Configuration
APP_URL="http://localhost:3000"
PORT=3000
EOF
            log_success ".env.local created"
        fi
    else
        log_success ".env.local already exists"
    fi
}

start_ollama_service() {
    if ! command -v ollama &> /dev/null; then
        return
    fi

    if [ "$OLLAMA_RUNNING" = true ]; then
        return
    fi

    log_info "Starting Ollama service..."

    if [[ "$OS" == "macos" ]]; then
        # macOS: Start using launch
        open -a Ollama
        log_info "Ollama started on macOS (check menu bar)"
    else
        # Linux: Start in background
        nohup ollama serve > /dev/null 2>&1 &
        log_info "Ollama service started in background"

        # Wait for service to be ready
        for i in {1..30}; do
            if curl -s http://localhost:11434/api/tags &> /dev/null; then
                log_success "Ollama service is ready"
                OLLAMA_RUNNING=true
                return
            fi
            sleep 1
        done

        log_warn "Ollama service may not have started properly"
    fi
}

run_build() {
    log_info "Building the project..."

    npm run build

    log_success "Build completed"
}

print_next_steps() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}  Installation Complete!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
    echo "To start the development server:"
    echo -e "  ${BLUE}npm run dev${NC}"
    echo ""
    echo "Then open your browser to:"
    echo -e "  ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo "Available commands:"
    echo -e "  ${BLUE}npm run dev${NC}      - Start development server"
    echo -e "  ${BLUE}npm run build${NC}   - Build for production"
    echo -e "  ${BLUE}npm run lint${NC}    - Run TypeScript type check"
    echo -e "  ${BLUE}npm run test${NC}    - Run tests"
    echo ""
    echo "Documentation:"
    echo -e "  ${BLUE}cat CLAUDE.md${NC}    - Project documentation"
    echo ""
}

# Main installation flow
main() {
    print_banner

    check_os
    check_node
    check_npm
    create_env_file
    install_dependencies
    check_ollama

    if [ "$OLLAMA_RUNNING" = false ] && command -v ollama &> /dev/null; then
        read -p "Do you want to start Ollama service now? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            start_ollama_service
        fi
    fi

    check_model
    run_build
    print_next_steps
}

# Run main function
main "$@"