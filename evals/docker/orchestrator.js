/**
 * Docker Orchestrator for Roo Code Evals
 *
 * This module replaces the VSCode launching functionality with Docker container management.
 * It dynamically creates and manages task containers running Code Server.
 */

import * as fs from "fs"
import * as path from "path"
import * as os from "os"
import * as net from "net"
import { execa } from "execa"
import pWaitFor from "p-wait-for"

// Port range for task containers
const TASK_PORT_START = parseInt(process.env.TASK_PORT_START || "8080", 10)
const TASK_PORT_RANGE = parseInt(process.env.TASK_PORT_RANGE || "10", 10)
const HOST_IP = process.env.HOST_IP || "host.docker.internal"
const TASK_CONTAINER_IMAGE = process.env.TASK_CONTAINER_IMAGE || "roo-code-evals-task:latest"

// Track used ports
const usedPorts = new Set()

/**
 * Find an available port in the configured range
 */
async function findAvailablePort() {
	for (let port = TASK_PORT_START; port < TASK_PORT_START + TASK_PORT_RANGE; port++) {
		if (!usedPorts.has(port)) {
			// Check if the port is actually available
			try {
				const server = net.createServer()
				await new Promise((resolve, reject) => {
					server.once("error", reject)
					server.once("listening", () => {
						server.close()
						resolve()
					})
					server.listen(port)
				})

				usedPorts.add(port)
				return port
			} catch (err) {
				// Port is not available, try the next one
				continue
			}
		}
	}

	throw new Error(`No available ports in range ${TASK_PORT_START}-${TASK_PORT_START + TASK_PORT_RANGE - 1}`)
}

/**
 * Release a port when it's no longer needed
 */
function releasePort(port) {
	usedPorts.delete(port)
}

/**
 * Launch a task container with Code Server
 */
export async function launchTaskContainer({ task, run }) {
	const { language, exercise } = task
	const containerName = `roo-code-evals-task-${run.id}-${task.id}`
	const port = await findAvailablePort()

	console.log(`${Date.now()} [orchestrator] Starting task container ${containerName} on port ${port}`)

	// Create a TCP socket for IPC instead of Unix socket
	const ipcPort = port + 1000 // Use port+1000 for IPC
	const ipcAddress = `${HOST_IP}:${ipcPort}`

	// The exercises repository is mounted at /app/exercises
	const exercisesPath = path.resolve("/app/exercises")

	// Check if the exercise exists
	if (!fs.existsSync(path.join(exercisesPath, language, exercise))) {
		console.error(`${Date.now()} [orchestrator] Exercise not found: ${language}/${exercise}`)
		throw new Error(`Exercise not found: ${language}/${exercise}`)
	}

	// Launch the container
	await execa("docker", [
		"run",
		"-d",
		"--name",
		containerName,
		"--network",
		"evals_evals-network",
		"-p",
		`${port}:8080`,
		"-p",
		`${ipcPort}:${ipcPort}`,
		"-e",
		`LANGUAGE=${language}`,
		"-e",
		`EXERCISE=${exercise}`,
		"-e",
		`ROO_CODE_IPC_SOCKET_PATH=tcp://${ipcAddress}`,
		"-e",
		`OPENROUTER_API_KEY=${process.env.OPENROUTER_API_KEY}`,
		"-v",
		"../../evals:/app/exercises:ro",
		"-v",
		"/roo-code:/roo-code:ro",
		TASK_CONTAINER_IMAGE,
	])

	// Wait for the container to be ready
	await new Promise((resolve) => setTimeout(resolve, 3000))

	return {
		containerName,
		port,
		ipcAddress,
		cleanup: async () => {
			try {
				// Stop and remove the container
				await execa("docker", ["stop", containerName])
				await execa("docker", ["rm", containerName])
				releasePort(port)
				console.log(`${Date.now()} [orchestrator] Cleaned up container ${containerName}`)
			} catch (error) {
				console.error(`${Date.now()} [orchestrator] Error cleaning up container ${containerName}:`, error)
			}
		},
	}
}

/**
 * Check if a container is running
 */
export async function isContainerRunning(containerName) {
	try {
		const { stdout } = await execa("docker", ["inspect", "-f", "{{.State.Running}}", containerName])
		return stdout.trim() === "true"
	} catch (error) {
		return false
	}
}

/**
 * Replace the original runExercise function with a Docker-based implementation
 */
export async function runExerciseWithDocker({ run, task, server }) {
	const { language, exercise } = task
	const prompt = fs.readFileSync(path.resolve("/app/exercises", `prompts/${language}.md`), "utf-8")

	console.log(`${Date.now()} [orchestrator] Starting task ${task.id} (${language}/${exercise})`)

	// Launch the task container
	const { containerName, port, ipcAddress, cleanup } = await launchTaskContainer({ task, run })

	// Connect to the IPC server
	const ipcClient = new net.Socket()
	let isConnected = false

	try {
		// Connect to the IPC server
		await new Promise((resolve, reject) => {
			const [host, portStr] = ipcAddress.split(":")
			const port = parseInt(portStr, 10)

			ipcClient.connect(port, host, () => {
				isConnected = true
				resolve()
			})

			ipcClient.on("error", reject)
		})

		// Wait for the container to be ready
		await pWaitFor(async () => await isContainerRunning(containerName), { interval: 1000, timeout: 30000 })

		// Send the task command
		const taskCommand = {
			type: "TaskCommand",
			origin: "Client",
			clientId: "orchestrator",
			data: {
				commandName: "StartNewTask",
				data: {
					configuration: {
						...run.settings,
						openRouterApiKey: process.env.OPENROUTER_API_KEY,
					},
					text: prompt,
					newTab: true,
				},
			},
		}

		ipcClient.write(JSON.stringify(taskCommand))

		// Wait for the task to complete
		// This would normally involve handling IPC messages, but for simplicity
		// we'll just wait for a fixed time in this example
		await new Promise((resolve) => setTimeout(resolve, 300000)) // 5 minutes

		return { success: true }
	} catch (error) {
		console.error(`${Date.now()} [orchestrator] Error running task:`, error)
		return { success: false }
	} finally {
		// Clean up
		if (isConnected) {
			ipcClient.end()
		}

		await cleanup()
	}
}

// Export the Docker-based implementation to replace the original functions
export default {
	launchTaskContainer,
	runExerciseWithDocker,
	isContainerRunning,
}
