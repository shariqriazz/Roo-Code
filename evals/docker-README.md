# Roo Code Evals - Docker Setup

This directory contains the Docker setup for running Roo Code Evals in a containerized environment. The setup allows running the evals system on any host OS (macOS, Windows, Linux) using Docker containers.

## Overview

The Docker setup consists of the following components:

1. **Base Image**: Contains all the required dependencies for running evals (Node.js, Python, Go, Rust, Java, etc.)
2. **Web Container**: Runs the Next.js frontend application
3. **Orchestrator Container**: Manages the evaluation process and spawns task containers
4. **Task Containers**: One container per concurrent task, each running Code Server

## Prerequisites

- Docker
- Docker Compose
- Git
- OpenRouter API key

## Directory Structure

```
evals/
├── Dockerfile.base         # Base image with all dependencies
├── Dockerfile.web          # Web application container
├── Dockerfile.orchestrator # Orchestrator container
├── Dockerfile.task         # Task container with Code Server
├── docker-compose.yml      # Docker Compose configuration
├── docker/                 # Docker-specific code
│   ├── orchestrator.js     # Container orchestration logic
│   ├── ipc-tcp.js          # TCP-based IPC implementation
│   └── build-extension.sh  # Script to build Roo Code extension
├── docker-setup.sh         # Setup script
└── docker-README.md        # This file
```

## Getting Started

1. Run the setup script:

```bash
chmod +x docker-setup.sh
./docker-setup.sh
```

The script will:

- Present a language selection menu (same as the original script)
- Clone the evals repository to the same location as the original script
- Build the Docker images
- Set up the database
- Validate your OpenRouter API key
- Provide the option to build the Roo Code extension
- Start the system when ready

2. Access the web interface at http://localhost:3000

## Directory Structure Compatibility

This Docker setup maintains the exact same directory structure as the original macOS setup:

- If Roo-Code is in `/Users/shariqriaz/Roo-Code/`
- The evals exercises are cloned to `/Users/shariqriaz/evals/`

This ensures compatibility with the original system and avoids confusion.

## Running Evaluations

You can run evaluations using the web interface or directly from the command line:

```bash
# Run a specific evaluation
docker-compose exec orchestrator pnpm cli run javascript fibonacci

# Run all evaluations for a language
docker-compose exec orchestrator pnpm cli run javascript all

# Run all evaluations for all languages
docker-compose exec orchestrator pnpm cli run all
```

## How It Works

1. The web container provides the user interface for managing evaluations
2. When an evaluation is started, the orchestrator container:
    - Creates a task container for each concurrent task
    - Configures the container with the appropriate language and exercise
    - Starts Code Server in the container
    - Communicates with the container via TCP sockets
3. Each task container:
    - Runs Code Server with the exercise workspace
    - Executes the evaluation task
    - Reports results back to the orchestrator
4. Results are stored in the database and displayed in the web interface

## Container Networking

- Web container: Exposes port 3000 for the web interface
- Orchestrator container: Exposes port 4000 for the API
- Task containers: Each exposes a unique port in the range 8080-8090 for Code Server

## Data Persistence

- Database: Stored in the `./data` directory
- Exercises: Mounted from the host system at `../../evals`

## Technical Details

### TypeScript Compilation

The Docker setup includes workarounds for TypeScript compilation issues:

- Creates placeholder JavaScript files for imports
- Adds fallback mechanisms for TypeScript compilation
- Runs the web app in development mode for better debugging

### IPC Communication

The original system uses Unix sockets for IPC, which doesn't work well across containers. This Docker setup:

- Replaces Unix socket IPC with TCP-based communication
- Implements a custom IPC client/server in `docker/ipc-tcp.js`
- Uses Docker's built-in networking for container-to-container communication

### Code Server Integration

Code Server is used as a replacement for VSCode:

- Runs without authentication for internal use
- Has the same extensions as the original setup
- Uses the same workspace paths

## Troubleshooting

### Common Issues

1. **Port conflicts**: If you have services running on ports 3000, 4000, or 8080-8090, you may need to modify the port mappings in `docker-compose.yml`.

2. **Container communication**: If containers cannot communicate with each other, check the Docker network configuration.

3. **Resource limitations**: Running multiple containers may require significant CPU and memory resources. Adjust Docker resource limits if needed.

### Logs

To view logs:

```bash
# All containers
docker-compose logs

# Specific container
docker-compose logs web
docker-compose logs orchestrator
docker-compose logs task-1-1  # Task container for run 1, task 1
```

## Cleanup

To stop and remove all containers:

```bash
docker-compose down
```

To remove all data (including the database):

```bash
docker-compose down
rm -rf data
```
