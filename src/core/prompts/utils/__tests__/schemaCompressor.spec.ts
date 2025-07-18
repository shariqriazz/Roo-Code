// npx vitest core/prompts/utils/__tests__/schemaCompressor.spec.ts

import { describe, it, expect } from "vitest"
import { jsonSchemaToXml, compressSchemaWithMetrics, compressToolSchemas } from "../schemaCompressor"

describe("schemaCompressor", () => {
	describe("jsonSchemaToXml", () => {
		it("should handle empty schema", () => {
			expect(jsonSchemaToXml(null)).toBe("<schema></schema>")
			expect(jsonSchemaToXml({})).toBe("<schema></schema>")
			expect(jsonSchemaToXml({ properties: {} })).toBe("<schema></schema>")
		})

		it("should compress simple string parameter", () => {
			const schema = {
				type: "object",
				properties: {
					query: {
						type: "string",
						description: "The search query",
					},
				},
				required: ["query"],
			}

			expect(jsonSchemaToXml(schema)).toBe("<schema>query*:string</schema>")
		})

		it("should handle multiple parameters with different types", () => {
			const schema = {
				type: "object",
				properties: {
					topic: {
						type: "string",
						description: "The topic to search",
					},
					count: {
						type: "number",
						description: "Number of results",
					},
					include_examples: {
						type: "boolean",
						description: "Whether to include examples",
					},
				},
				required: ["topic", "count"],
			}

			expect(jsonSchemaToXml(schema)).toBe(
				"<schema>topic*:string, count*:number, include_examples?:boolean</schema>",
			)
		})

		it("should handle array types", () => {
			const schema = {
				type: "object",
				properties: {
					tech_stack: {
						type: "array",
						items: {
							type: "string",
						},
					},
					numbers: {
						type: "array",
						items: {
							type: "number",
						},
					},
				},
				required: ["tech_stack"],
			}

			expect(jsonSchemaToXml(schema)).toBe("<schema>tech_stack*:array[string], numbers?:array[number]</schema>")
		})

		it("should handle enum types", () => {
			const schema = {
				type: "object",
				properties: {
					format: {
						type: "string",
						enum: ["json", "xml", "csv"],
					},
					size: {
						type: "string",
						enum: ["small", "medium", "large", "xlarge", "xxlarge"],
					},
				},
				required: ["format"],
			}

			expect(jsonSchemaToXml(schema)).toBe("<schema>format*:enum(json|xml|csv), size?:enum</schema>")
		})

		it("should handle object types", () => {
			const schema = {
				type: "object",
				properties: {
					requirements: {
						type: "object",
						properties: {
							description: { type: "string" },
							scale: { type: "string" },
						},
					},
				},
				required: ["requirements"],
			}

			expect(jsonSchemaToXml(schema)).toBe("<schema>requirements*:object</schema>")
		})

		it("should handle date and url formats", () => {
			const schema = {
				type: "object",
				properties: {
					created_date: {
						type: "string",
						format: "date",
					},
					website: {
						type: "string",
						format: "uri",
					},
					email: {
						type: "string",
						format: "email",
					},
				},
			}

			expect(jsonSchemaToXml(schema)).toBe("<schema>created_date?:date, website?:url, email?:email</schema>")
		})
	})

	describe("compressSchemaWithMetrics", () => {
		it("should calculate compression metrics", () => {
			const schema = {
				type: "object",
				properties: {
					query: {
						type: "string",
						description: "The natural language question to answer using web search.",
					},
				},
				required: ["query"],
			}

			const result = compressSchemaWithMetrics(schema)

			expect(result.compressed).toBe("<schema>query*:string</schema>")
			expect(result.originalTokens).toBeGreaterThan(result.compressedTokens)
			expect(result.reduction).toBeGreaterThan(50) // Should be significant reduction
		})
	})

	describe("compressToolSchemas", () => {
		it("should compress multiple tools and calculate total metrics", () => {
			const tools = [
				{
					name: "search",
					inputSchema: {
						type: "object",
						properties: {
							query: { type: "string" },
						},
						required: ["query"],
					},
				},
				{
					name: "translate",
					inputSchema: {
						type: "object",
						properties: {
							text: { type: "string" },
							target_lang: { type: "string" },
							source_lang: { type: "string" },
						},
						required: ["text", "target_lang"],
					},
				},
			]

			const result = compressToolSchemas(tools)

			expect(result.compressedTools).toHaveLength(2)
			expect(result.compressedTools[0].compressedSchema).toBe("<schema>query*:string</schema>")
			expect(result.compressedTools[1].compressedSchema).toBe(
				"<schema>text*:string, target_lang*:string, source_lang?:string</schema>",
			)
			expect(result.totalReduction).toBeGreaterThan(0)
			expect(result.originalTokens).toBeGreaterThan(result.compressedTokens)
		})
	})

	describe("real MCP server examples", () => {
		it("should compress google-ai-search-mcp tool schema", () => {
			const schema = {
				type: "object",
				properties: {
					topic: {
						type: "string",
						description: "The software/library/framework topic (e.g., 'React Router', 'Python requests').",
					},
					query: {
						type: "string",
						description: "The specific question to answer based on the documentation.",
					},
				},
				required: ["topic", "query"],
			}

			expect(jsonSchemaToXml(schema)).toBe("<schema>topic*:string, query*:string</schema>")
		})

		it("should compress context7-enhanced tool schema", () => {
			const schema = {
				type: "object",
				properties: {
					libraryName: {
						type: "string",
						description: "Library name to search for and retrieve a Context7-compatible library ID.",
					},
					sort: {
						type: "string",
						enum: ["trust_score", "last_updated", "snippets"],
						description: "Sort results by trust score, last updated date, or snippet count",
					},
					minTrustScore: {
						type: "number",
						description: "Filter results to only show libraries with trust score >= this value",
					},
					maxTrustScore: {
						type: "number",
						description: "Filter results to only show libraries with trust score <= this value",
					},
				},
				required: ["libraryName"],
			}

			expect(jsonSchemaToXml(schema)).toBe(
				"<schema>libraryName*:string, sort?:enum(trust_score|last_updated|snippets), minTrustScore?:number, maxTrustScore?:number</schema>",
			)
		})
	})
})
