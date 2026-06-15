#
# LAhe Installation Script for Windows (PowerShell)
# Automates dependency installation and service initialization
#

# Error handling
$ErrorActionPreference = "Stop"

# Colors
function Write-Color {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Info {
    Write-Color "[INFO] " -Color "Cyan"
    Write-Host $args[0]
}

function Write-Success {
    Write-Color "[OK] " -Color "Green"
    Write-Host $args[0]
}

function Write-Warn {
    Write-Color "[WARN] " -Color "Yellow"
    Write-Host $args[0]
}

function Write-Error {
    Write-Color "[ERROR] " -Color "Red"
    Write-Host $args[0]
}

function Print-Banner {
    Write-Host ""
    Write-Color "  _   _     _             _   _          _   " -Color "Cyan"
    Write-Color " | \ | |   | |           | | (_)        | |  " -Color "Cyan"
    Write-Color " |  \| |___| |_ _ __ ___ | |_ _  ___  __| | " -Color "Cyan"
    Write-Color " | . \` / __| __| '__/ _ \| __| |/ __|/ _\` |" -Color "Cyan"
    Write-Color " | |\  \__ \ |_| | | (_) | |_| | (__| (_| |" -Color "Cyan"
    Write-Color " |_| \_|___/\__|_|  \___/ \__|_|\___|\__,_|" -Color "Cyan"
    Write-Host ""
    Write-Color "           Local Arch Helper v1.0" -Color "White"
    Write-Host ""
}

function Check-Node {
    Write-Info "Checking Node.js installation..."

    try {
        $nodeVersion = node --version
        $majorVersion = [int]($nodeVersion -replace 'v(\d+).*', '$1')

        if ($majorVersion -lt 20) {
            Write-Error "Node.js version $nodeVersion is too old (requires 20+)"
            Write-Info "Please install Node.js 20 or higher: https://nodejs.org/"
            exit 1
        }

        Write-Success "Node.js $nodeVersion found"
        return $true
    } catch {
        Write-Error "Node.js not found"
        Write-Info "Please install Node.js 20 or higher: https://nodejs.org/"
        exit 1
    }
}

function Check-Npm {
    Write-Info "Checking npm installation..."

    try {
        $npmVersion = npm --version
        Write-Success "npm $npmVersion found"
        return $true
    } catch {
        Write-Error "npm not found"
        exit 1
    }
}

function Check-Ollama {
    Write-Info "Checking Ollama installation..."

    try {
        $ollamaVersion = ollama --version 2>$null
        Write-Success "Ollama $ollamaVersion found"

        # Check if Ollama is running
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -UseBasicParsing
            Write-Success "Ollama service is running"
            $global:OllamaRunning = $true
        } catch {
            Write-Warn "Ollama is installed but not running"
            $global:OllamaRunning = $false
        }

        return $true
    } catch {
        Write-Warn "Ollama not found"
        Write-Info "Ollama is required for AI features"
        Write-Info "Install it from: https://ollama.com/download"
        return $false
    }
}

function Install-Dependencies {
    Write-Info "Installing project dependencies..."

    if (Test-Path "package-lock.json") {
        npm ci --silent
    } else {
        npm install --silent
    }

    Write-Success "Dependencies installed"
}

function Check-Model {
    if (!(Get-Command ollama -ErrorAction SilentlyContinue)) {
        return
    }

    Write-Info "Checking for installed Ollama models..."

    try {
        $models = ollama list 2>$null | Select-Object -Skip 1 | ForEach-Object { ($_ -split '\s+')[0] }

        if ([string]::IsNullOrWhiteSpace($models)) {
            Write-Warn "No Ollama models found"

            $defaultModel = "qwen3.5:0.8b"
            Write-Info "Recommended model: $defaultModel (~500MB)"

            $response = Read-Host "Do you want to download $defaultModel now? (y/N)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                Write-Info "Downloading $defaultModel..."
                ollama pull $defaultModel
                Write-Success "Model downloaded successfully"
            }
        } else {
            Write-Success "Found models: $($models -join ', ')"
        }
    } catch {
        Write-Warn "Could not check models"
    }
}

function Create-EnvFile {
    if (-not (Test-Path ".env.local")) {
        Write-Info "Creating .env.local from .env.example..."

        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env.local"
            Write-Success ".env.local created"
        } else {
            Write-Error ".env.example not found"
            Write-Warn "Creating minimal .env.local..."

            @"
# Ollama Configuration
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen3.5:0.8b"

# App Configuration
APP_URL="http://localhost:3000"
PORT=3000
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

            Write-Success ".env.local created"
        }
    } else {
        Write-Success ".env.local already exists"
    }
}

function Start-OllamaService {
    if (!(Get-Command ollama -ErrorAction SilentlyContinue)) {
        return
    }

    if ($global:OllamaRunning) {
        return
    }

    Write-Info "Starting Ollama service..."

    try {
        Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
        Write-Info "Ollama service started in background"

        # Wait for service to be ready
        $maxAttempts = 30
        for ($i = 1; $i -le $maxAttempts; $i++) {
            try {
                Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -UseBasicParsing | Out-Null
                Write-Success "Ollama service is ready"
                $global:OllamaRunning = $true
                return
            } catch {
                Start-Sleep -Seconds 1
            }
        }

        Write-Warn "Ollama service may not have started properly"
    } catch {
        Write-Error "Failed to start Ollama service"
    }
}

function Run-Build {
    Write-Info "Building the project..."

    npm run build

    Write-Success "Build completed"
}

function Print-NextSteps {
    Write-Host ""
    Write-Color "═══════════════════════════════════════" -Color "Green"
    Write-Color "  Installation Complete!" -Color "Green"
    Write-Color "═══════════════════════════════════════" -Color "Green"
    Write-Host ""
    Write-Host "To start the development server:"
    Write-Color "  npm run dev" -Color "Cyan"
    Write-Host ""
    Write-Host "Then open your browser to:"
    Write-Color "  http://localhost:3000" -Color "Cyan"
    Write-Host ""
    Write-Host "Available commands:"
    Write-Color "  npm run dev" -Color "Cyan" -NoNewline
    Write-Host "      - Start development server"
    Write-Color "  npm run build" -Color "Cyan" -NoNewline
    Write-Host "   - Build for production"
    Write-Color "  npm run lint" -Color "Cyan" -NoNewline
    Write-Host "    - Run TypeScript type check"
    Write-Color "  npm run test" -Color "Cyan" -NoNewline
    Write-Host "     - Run tests"
    Write-Host ""
    Write-Host "Documentation:"
    Write-Color "  cat CLAUDE.md" -Color "Cyan" -NoNewline
    Write-Host "    - Project documentation"
    Write-Host ""
}

# Main installation flow
try {
    Print-Banner

    Check-Node | Out-Null
    Check-Npm | Out-Null
    Create-EnvFile
    Install-Dependencies
    Check-Ollama | Out-Null

    if (!$global:OllamaRunning -and (Get-Command ollama -ErrorAction SilentlyContinue)) {
        $response = Read-Host "Do you want to start Ollama service now? (y/N)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Start-OllamaService
        }
    }

    Check-Model
    Run-Build
    Print-NextSteps
} catch {
    Write-Error "Installation failed: $_"
    exit 1
}