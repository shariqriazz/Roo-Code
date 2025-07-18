export interface SchemaCompressionResult {
	compressed: string
	originalTokens: number
	compressedTokens: number
	reduction: number
}

export function jsonSchemaToXml(schema: any): string {
	if (!schema || typeof schema !== "object") {
		return "<schema></schema>"
	}

	if (!schema.properties || Object.keys(schema.properties).length === 0) {
		return "<schema></schema>"
	}

	const required = schema.required || []
	const params = Object.entries(schema.properties).map(([key, prop]: [string, any]) => {
		const isRequired = required.includes(key) ? "*" : "?"
		const type = getCompactType(prop)
		return `${key}${isRequired}:${type}`
	})

	return `<schema>${params.join(", ")}</schema>`
}

function getCompactType(prop: any): string {
	if (!prop || typeof prop !== "object") {
		return "any"
	}

	if (prop.type === "array") {
		if (prop.items?.type) {
			return `array[${prop.items.type}]`
		}
		if (prop.items?.enum) {
			return "array[enum]"
		}
		return "array[any]"
	}

	if (prop.enum && Array.isArray(prop.enum)) {
		if (prop.enum.length <= 3) {
			return `enum(${prop.enum.join("|")})`
		}
		return "enum"
	}

	if (prop.type === "object") {
		return "object"
	}

	if (prop.oneOf || prop.anyOf) {
		const types = (prop.oneOf || prop.anyOf).map((p: any) => p.type).filter(Boolean)
		if (types.length > 0) {
			return types.join("|")
		}
		return "union"
	}

	switch (prop.type) {
		case "string":
			if (prop.format === "date") return "date"
			if (prop.format === "date-time") return "datetime"
			if (prop.format === "email") return "email"
			if (prop.format === "uri") return "url"
			return "string"
		case "number":
		case "integer":
			return "number"
		case "boolean":
			return "boolean"
		default:
			return prop.type || "any"
	}
}

function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4)
}

export function compressSchemaWithMetrics(schema: any): SchemaCompressionResult {
	const originalJson = JSON.stringify(schema, null, 2)
	const compressed = jsonSchemaToXml(schema)

	const originalTokens = estimateTokens(originalJson)
	const compressedTokens = estimateTokens(compressed)
	const reduction = originalTokens > 0 ? ((originalTokens - compressedTokens) / originalTokens) * 100 : 0

	return {
		compressed,
		originalTokens,
		compressedTokens,
		reduction: Math.round(reduction),
	}
}

export function compressToolSchemas(tools: Array<{ name: string; inputSchema?: any }>): {
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

	const totalReduction =
		totalOriginalTokens > 0
			? Math.round(((totalOriginalTokens - totalCompressedTokens) / totalOriginalTokens) * 100)
			: 0

	return {
		compressedTools,
		totalReduction,
		originalTokens: totalOriginalTokens,
		compressedTokens: totalCompressedTokens,
	}
}
