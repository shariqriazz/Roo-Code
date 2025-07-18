// Constants for better maintainability
const ENUM_DISPLAY_THRESHOLD = 3
const TOKENS_PER_CHARACTER = 4

// JSON Schema type definitions
interface JsonSchemaProperty {
	type?: string
	format?: string
	enum?: string[]
	items?: JsonSchemaProperty
	properties?: Record<string, JsonSchemaProperty>
	oneOf?: JsonSchemaProperty[]
	anyOf?: JsonSchemaProperty[]
	description?: string
}

interface JsonSchema {
	type?: string
	properties?: Record<string, JsonSchemaProperty>
	required?: string[]
	items?: JsonSchemaProperty
}

export interface SchemaCompressionResult {
	compressed: string
	originalTokens: number
	compressedTokens: number
	reduction: number
}

/**
 * Escapes special XML characters to prevent XSS vulnerabilities
 * @param text - The text to escape
 * @returns The escaped text safe for XML
 */
function escapeXml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;")
}

/**
 * Converts a JSON Schema to a compact XML representation
 * @param schema - The JSON Schema to compress
 * @returns A compressed XML string representation of the schema
 */
export function jsonSchemaToXml(schema: JsonSchema | null | undefined): string {
	if (!schema || typeof schema !== "object") {
		return "<schema></schema>"
	}

	// Handle array schemas at root level
	if (schema.type === "array" && schema.items) {
		const itemType = getCompactType(schema.items)
		return `<schema>array[${itemType}]</schema>`
	}

	if (!schema.properties || Object.keys(schema.properties).length === 0) {
		return "<schema></schema>"
	}

	const required = schema.required || []
	const params = Object.entries(schema.properties).map(([key, prop]) => {
		const isRequired = required.includes(key) ? "*" : "?"
		const type = getCompactType(prop)
		// Escape the key to prevent XSS
		const safeKey = escapeXml(key)
		return `${safeKey}${isRequired}:${type}`
	})

	return `<schema>${params.join(", ")}</schema>`
}

/**
 * Determines the compact type representation for a schema property
 * @param prop - The JSON Schema property
 * @returns A compact string representation of the type
 */
function getCompactType(prop: JsonSchemaProperty | null | undefined): string {
	if (!prop || typeof prop !== "object") {
		return "any"
	}

	// Handle array types
	if (prop.type === "array") {
		if (prop.items) {
			const itemType = getCompactType(prop.items)
			return `array[${itemType}]`
		}
		return "array[any]"
	}

	// Handle enum types
	if (prop.enum && Array.isArray(prop.enum)) {
		if (prop.enum.length <= ENUM_DISPLAY_THRESHOLD) {
			// Escape enum values to prevent XSS
			const safeEnumValues = prop.enum.map(escapeXml).join("|")
			return `enum(${safeEnumValues})`
		}
		return "enum"
	}

	// Handle object types
	if (prop.type === "object") {
		// Could potentially show nested structure for simple objects
		if (prop.properties && Object.keys(prop.properties).length <= 2) {
			const nestedProps = Object.entries(prop.properties)
				.map(([k, v]) => `${escapeXml(k)}:${getCompactType(v)}`)
				.join(",")
			return `object{${nestedProps}}`
		}
		return "object"
	}

	// Handle union types (oneOf/anyOf)
	if (prop.oneOf || prop.anyOf) {
		const unionArray = prop.oneOf || prop.anyOf || []
		const types = unionArray.map((p) => p.type).filter((t): t is string => Boolean(t))

		if (types.length > 0) {
			return types.join("|")
		}
		return "union"
	}

	// Handle string types with formats
	switch (prop.type) {
		case "string":
			if (prop.format === "date") return "date"
			if (prop.format === "date-time") return "datetime"
			if (prop.format === "email") return "email"
			if (prop.format === "uri" || prop.format === "url") return "url"
			if (prop.format === "uuid") return "uuid"
			if (prop.format === "ipv4") return "ipv4"
			if (prop.format === "ipv6") return "ipv6"
			return "string"
		case "number":
		case "integer":
			return "number"
		case "boolean":
			return "boolean"
		case "null":
			return "null"
		default:
			return prop.type || "any"
	}
}

/**
 * Estimates the number of tokens in a text string
 * Uses a more sophisticated algorithm based on common tokenization patterns
 * @param text - The text to estimate tokens for
 * @returns The estimated number of tokens
 */
function estimateTokens(text: string): number {
	// Handle null/undefined/empty strings
	if (!text) {
		return 0
	}

	// More accurate token estimation based on:
	// - Average English word length is ~4.7 characters
	// - Punctuation and whitespace add overhead
	// - JSON structure adds additional tokens

	// Count words (rough approximation)
	const words = text.split(/\s+/).filter((w) => w.length > 0).length

	// Count special JSON characters that typically become separate tokens
	const jsonTokens = (text.match(/[{}[\],:]/g) || []).length

	// Estimate based on character count for very short strings
	if (text.length < 20) {
		return Math.ceil(text.length / 3)
	}

	// Combined estimation
	return Math.ceil(words * 1.3 + jsonTokens * 0.5)
}

/**
 * Compresses a JSON Schema and provides metrics about the compression
 * @param schema - The JSON Schema to compress
 * @returns Compression result with metrics
 */
export function compressSchemaWithMetrics(schema: JsonSchema | null | undefined): SchemaCompressionResult {
	const originalJson = JSON.stringify(schema, null, 2)
	const compressed = jsonSchemaToXml(schema)

	const originalTokens = estimateTokens(originalJson)
	const compressedTokens = estimateTokens(compressed)

	// Calculate reduction, ensuring it's never negative
	let reduction = 0
	if (originalTokens > 0 && compressedTokens < originalTokens) {
		reduction = ((originalTokens - compressedTokens) / originalTokens) * 100
	}

	return {
		compressed,
		originalTokens,
		compressedTokens,
		reduction: Math.round(reduction),
	}
}

/**
 * Compresses multiple tool schemas and calculates aggregate metrics
 * @param tools - Array of tools with optional input schemas
 * @returns Compressed tools with total reduction metrics
 */
export function compressToolSchemas(tools: Array<{ name: string; inputSchema?: JsonSchema }>): {
	compressedTools: Array<{ name: string; compressedSchema: string }>
	totalReduction: number
	originalTokens: number
	compressedTokens: number
} {
	let totalOriginalTokens = 0
	let totalCompressedTokens = 0

	const compressedTools = tools.map((tool) => {
		const result = compressSchemaWithMetrics(tool.inputSchema)
		totalOriginalTokens += result.originalTokens
		totalCompressedTokens += result.compressedTokens

		return {
			name: tool.name,
			compressedSchema: result.compressed,
		}
	})

	// Calculate total reduction, ensuring it's never negative
	let totalReduction = 0
	if (totalOriginalTokens > 0 && totalCompressedTokens < totalOriginalTokens) {
		totalReduction = Math.round(((totalOriginalTokens - totalCompressedTokens) / totalOriginalTokens) * 100)
	}

	return {
		compressedTools,
		totalReduction,
		originalTokens: totalOriginalTokens,
		compressedTokens: totalCompressedTokens,
	}
}
