# Docker Containerization Plan for Roo-Code Evals

## Current System Analysis

The current evals system is designed for macOS and consists of:

1. **Frontend (Web App)**: A Next.js application that provides a UI for managing and viewing evals
2. **CLI**: A command-line tool that runs the actual evaluations with concurrency support
3. **Database**: Uses SQLite (local file) or Turso (cloud) for data storage
4. **VSCode Integration**: Opens VSCode instances to run evaluations

The system clones the evals repository in the same directory as Roo-Code and uses IPC (Inter-Process Communication) via Unix sockets for communication between components.

## Containerization Goals

1. Create a Docker-based solution that works on any host OS (macOS, Windows, Linux)
2. Replace VSCode with Code Server for browser-based code editing
3. Implement containerized concurrency where each task runs in its own container
4. Ensure proper port management to avoid conflicts
5. Maintain the same functionality as the original system

## Implementation Summary

We've successfully implemented a Docker-based solution that meets all the goals while maintaining compatibility with the original system's directory structure and naming conventions.

### Key Components Created

1. **Dockerfiles**:

    - `Dockerfile.base`: Base image with Ubuntu, language runtimes, and Code Server
    - `Dockerfile.web`: Container for the Next.js frontend
    - `Dockerfile.orchestrator`: Container for the CLI orchestrator
    - `Dockerfile.task`: Container for individual evaluation tasks with Code Server

2. **Docker Compose Configuration**:

    - Created a comprehensive `docker-compose.yml` that orchestrates all containers
    - Set up proper networking between containers
    - Configured volume mounts for code and data persistence

3. **Modified Code**:

    - `docker/orchestrator.js`: Replaces VSCode launching with Docker container management
    - `docker/ipc-tcp.js`: TCP-based IPC implementation to replace Unix sockets
    - `docker/build-extension.sh`: Script to build and install the Roo Code extension

4. **Setup Script**:
    - Created `docker-setup.sh` that mirrors the functionality of the original macOS script
    - Implemented language selection menu
    - Added support for building the Roo Code extension
    - Configured database initialization

### Directory Structure

We maintained the exact same directory structure as the original setup:

- If Roo-Code is in `/Users/shariqriaz/Roo-Code/`
- The evals exercises are cloned to `/Users/shariqriaz/evals/`

## Technical Implementation Details

### Base Image

The base image (`Dockerfile.base`) includes:

- Ubuntu 22.04 as the base OS
- Node.js 20.x, Python 3.13, Go 1.24, Rust, and Java 17
- pnpm, git, Docker CLI, and GitHub CLI
- Code Server with required extensions pre-installed
- Non-root user (coder) for running applications securely

### Container Communication

- Replaced Unix socket IPC with TCP-based communication
- Implemented a custom IPC client/server in `docker/ipc-tcp.js`
- Used Docker's built-in networking for container-to-container communication

### TypeScript Compilation

Addressed TypeScript compilation challenges by:

- Creating placeholder JavaScript files for imports
- Adding fallback mechanisms for TypeScript compilation
- Running the web app in development mode for better debugging

### Code Server Integration

- Configured Code Server to run without authentication for internal use
- Set up proper workspace paths to match the expected structure
- Added support for installing the Roo Code extension

### Container Orchestration

- Implemented dynamic container creation for concurrent tasks
- Used Docker API through the orchestrator container
- Set up port allocation for Code Server instances (8080-8090)
- Added container cleanup after task completion

## Usage Instructions

1. Run the `docker-setup.sh` script
2. Select the programming languages you want to support
3. Choose whether to build the Roo Code extension
4. The script will set up the database and validate your API key
5. Start the system with Docker Compose

The web interface will be available at http://localhost:3000, and each Code Server instance will be accessible on a unique port in the range 8080-8090.

## Benefits of the Docker Approach

1. **Cross-Platform Compatibility**: Works on any OS that supports Docker
2. **Consistent Environment**: Same dependencies and configuration across all systems
3. **Isolated Execution**: Each task runs in its own container for better security and reliability
4. **Easy Deployment**: Simple setup process with minimal host dependencies
5. **Scalability**: Can be extended to run on remote servers or in cloud environments

## Future Enhancements

1. **Resource Optimization**: Fine-tune container resource limits for better performance
2. **Cloud Deployment**: Add support for deploying to cloud environments
3. **Monitoring**: Implement container health monitoring and logging
4. **CI/CD Integration**: Add support for running evals as part of CI/CD pipelines
