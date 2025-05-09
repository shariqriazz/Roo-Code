/**
 * TCP-based IPC Client/Server for Docker environment
 *
 * This module replaces the Unix socket-based IPC with TCP sockets
 * for cross-container communication.
 */

import * as net from "net"
import { EventEmitter } from "events"
import crypto from "crypto"

/**
 * TCP-based IPC Server
 */
export class IpcServer extends EventEmitter {
	constructor(port, onClientConnect) {
		super()
		this.port =
			typeof port === "string" && port.includes(":") ? parseInt(port.split(":")[1], 10) : parseInt(port, 10)
		this.onClientConnect = onClientConnect
		this.clients = new Map()
		this.server = null
	}

	listen() {
		this.server = net.createServer((socket) => {
			const clientId = crypto.randomUUID()

			console.log(`[IpcServer] Client connected: ${clientId}`)

			this.clients.set(clientId, socket)

			socket.on("data", (data) => {
				try {
					const messages = data.toString().split("\n").filter(Boolean)

					for (const message of messages) {
						const parsedMessage = JSON.parse(message)
						this.emit(parsedMessage.type, parsedMessage)
					}
				} catch (error) {
					console.error("[IpcServer] Error parsing message:", error)
				}
			})

			socket.on("close", () => {
				console.log(`[IpcServer] Client disconnected: ${clientId}`)
				this.clients.delete(clientId)
				this.emit("disconnect", { clientId })
			})

			socket.on("error", (error) => {
				console.error(`[IpcServer] Socket error for client ${clientId}:`, error)
				this.clients.delete(clientId)
			})

			if (this.onClientConnect) {
				this.onClientConnect(clientId)
			}
		})

		this.server.listen(this.port, "0.0.0.0", () => {
			console.log(`[IpcServer] Listening on port ${this.port}`)
		})

		this.server.on("error", (error) => {
			console.error("[IpcServer] Server error:", error)
		})
	}

	broadcast(message) {
		const messageString = JSON.stringify(message) + "\n"

		for (const [clientId, socket] of this.clients.entries()) {
			try {
				socket.write(messageString)
			} catch (error) {
				console.error(`[IpcServer] Error broadcasting to client ${clientId}:`, error)
			}
		}
	}

	sendToClient(clientId, message) {
		const socket = this.clients.get(clientId)

		if (socket) {
			try {
				socket.write(JSON.stringify(message) + "\n")
			} catch (error) {
				console.error(`[IpcServer] Error sending to client ${clientId}:`, error)
			}
		} else {
			console.error(`[IpcServer] Client ${clientId} not found`)
		}
	}

	close() {
		if (this.server) {
			for (const [clientId, socket] of this.clients.entries()) {
				try {
					socket.end()
				} catch (error) {
					console.error(`[IpcServer] Error closing client ${clientId}:`, error)
				}
			}

			this.server.close()
			this.server = null
			this.clients.clear()
		}
	}
}

/**
 * TCP-based IPC Client
 */
export class IpcClient extends EventEmitter {
	constructor(address) {
		super()

		// Parse address (host:port or just port)
		if (typeof address === "string" && address.includes(":")) {
			const [host, portStr] = address.split(":")
			this.host = host
			this.port = parseInt(portStr, 10)
		} else {
			this.host = "localhost"
			this.port = typeof address === "string" ? parseInt(address, 10) : address
		}

		this.socket = new net.Socket()
		this.clientId = crypto.randomUUID()
		this.isReady = false
		this.messageBuffer = ""

		this.socket.on("connect", () => {
			console.log(`[IpcClient] Connected to ${this.host}:${this.port}`)
			this.isReady = true
			this.emit("connect")
		})

		this.socket.on("data", (data) => {
			try {
				// Handle potential partial messages
				this.messageBuffer += data.toString()
				const messages = this.messageBuffer.split("\n")

				// Last element might be incomplete
				this.messageBuffer = messages.pop() || ""

				for (const message of messages) {
					if (message.trim()) {
						const parsedMessage = JSON.parse(message)
						this.emit(parsedMessage.type, parsedMessage.data)
					}
				}
			} catch (error) {
				console.error("[IpcClient] Error parsing message:", error)
			}
		})

		this.socket.on("close", () => {
			console.log("[IpcClient] Connection closed")
			this.isReady = false
			this.emit("disconnect")
		})

		this.socket.on("error", (error) => {
			console.error("[IpcClient] Socket error:", error)
			this.isReady = false
		})

		// Connect to the server
		this.connect()
	}

	connect() {
		try {
			this.socket.connect(this.port, this.host)
		} catch (error) {
			console.error("[IpcClient] Connection error:", error)
		}
	}

	sendMessage(message) {
		if (this.isReady) {
			try {
				this.socket.write(JSON.stringify(message) + "\n")
			} catch (error) {
				console.error("[IpcClient] Error sending message:", error)
			}
		} else {
			console.error("[IpcClient] Cannot send message, not connected")
		}
	}

	disconnect() {
		if (this.socket) {
			try {
				this.socket.end()
			} catch (error) {
				console.error("[IpcClient] Error disconnecting:", error)
			}
		}
	}
}

export default {
	IpcServer,
	IpcClient,
}
