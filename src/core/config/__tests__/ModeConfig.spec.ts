// npx vitest src/core/config/__tests__/ModeConfig.spec.ts

import { ZodError } from "zod"

import { type ModeConfig, modeConfigSchema } from "@roo-code/types"

function validateCustomMode(mode: unknown): asserts mode is ModeConfig {
	modeConfigSchema.parse(mode)
}

describe("CustomModeSchema", () => {
	describe("validateCustomMode", () => {
		test("accepts valid mode configuration", () => {
			const validMode = {
				slug: "test",
				name: "Test Mode",
				roleDefinition: "Test role definition",
				tools: ["read_file"] as const,
			} satisfies ModeConfig

			expect(() => validateCustomMode(validMode)).not.toThrow()
		})

		test("accepts mode with multiple tools", () => {
			const validMode = {
				slug: "test",
				name: "Test Mode",
				roleDefinition: "Test role definition",
				tools: ["read_file", "write_to_file", "apply_diff"] as const,
			} satisfies ModeConfig

			expect(() => validateCustomMode(validMode)).not.toThrow()
		})

		test("accepts mode with optional customInstructions", () => {
			const validMode = {
				slug: "test",
				name: "Test Mode",
				roleDefinition: "Test role definition",
				customInstructions: "Custom instructions",
				tools: ["read_file"] as const,
			} satisfies ModeConfig

			expect(() => validateCustomMode(validMode)).not.toThrow()
		})

		test("rejects missing required fields", () => {
			const invalidModes = [
				{}, // All fields missing
				{ name: "Test" }, // Missing most fields
				{
					name: "Test",
					roleDefinition: "Role",
				}, // Missing slug and tools
			]

			invalidModes.forEach((invalidMode) => {
				expect(() => validateCustomMode(invalidMode)).toThrow(ZodError)
			})
		})

		test("rejects invalid slug format", () => {
			const invalidMode = {
				slug: "not@a@valid@slug",
				name: "Test Mode",
				roleDefinition: "Test role definition",
				tools: ["read_file"] as const,
			} satisfies Omit<ModeConfig, "slug"> & { slug: string }

			expect(() => validateCustomMode(invalidMode)).toThrow(ZodError)
			expect(() => validateCustomMode(invalidMode)).toThrow("Slug must contain only letters numbers and dashes")
		})

		test("rejects empty strings in required fields", () => {
			const emptyNameMode = {
				slug: "123e4567-e89b-12d3-a456-426614174000",
				name: "",
				roleDefinition: "Test role definition",
				tools: ["read_file"] as const,
			} satisfies ModeConfig

			const emptyRoleMode = {
				slug: "123e4567-e89b-12d3-a456-426614174000",
				name: "Test Mode",
				roleDefinition: "",
				tools: ["read_file"] as const,
			} satisfies ModeConfig

			expect(() => validateCustomMode(emptyNameMode)).toThrow("Name is required")
			expect(() => validateCustomMode(emptyRoleMode)).toThrow("Role definition is required")
		})

		test("rejects invalid tool configurations", () => {
			const invalidToolMode = {
				slug: "123e4567-e89b-12d3-a456-426614174000",
				name: "Test Mode",
				roleDefinition: "Test role definition",
				tools: ["not-a-valid-tool"] as any,
			}

			expect(() => validateCustomMode(invalidToolMode)).toThrow(ZodError)
		})

		test("handles null and undefined gracefully", () => {
			expect(() => validateCustomMode(null)).toThrow(ZodError)
			expect(() => validateCustomMode(undefined)).toThrow(ZodError)
		})

		test("rejects non-object inputs", () => {
			const invalidInputs = [42, "string", true, [], () => {}]

			invalidInputs.forEach((input) => {
				expect(() => validateCustomMode(input)).toThrow(ZodError)
			})
		})
	})

	describe("fileRegex", () => {
		it("validates a mode with file restrictions and descriptions", () => {
			const modeWithJustRegex = {
				slug: "markdown-editor",
				name: "Markdown Editor",
				roleDefinition: "Markdown editing mode",
				tools: ["read_file", ["write_to_file", { fileRegex: "\\.md$" }], "browser_action"],
			}

			const modeWithDescription = {
				slug: "docs-editor",
				name: "Documentation Editor",
				roleDefinition: "Documentation editing mode",
				tools: [
					"read_file",
					["write_to_file", { fileRegex: "\\.(md|txt)$", description: "Documentation files only" }],
					"browser_action",
				],
			}

			expect(() => modeConfigSchema.parse(modeWithJustRegex)).not.toThrow()
			expect(() => modeConfigSchema.parse(modeWithDescription)).not.toThrow()
		})

		it("validates file regex patterns", () => {
			const validPatterns = ["\\.md$", ".*\\.txt$", "[a-z]+\\.js$"]
			const invalidPatterns = ["[", "(unclosed", "\\"]

			validPatterns.forEach((pattern) => {
				const mode = {
					slug: "test",
					name: "Test",
					roleDefinition: "Test",
					tools: ["read_file", ["write_to_file", { fileRegex: pattern }]],
				}
				expect(() => modeConfigSchema.parse(mode)).not.toThrow()
			})

			invalidPatterns.forEach((pattern) => {
				const mode = {
					slug: "test",
					name: "Test",
					roleDefinition: "Test",
					tools: ["read_file", ["write_to_file", { fileRegex: pattern }]],
				}
				expect(() => modeConfigSchema.parse(mode)).toThrow()
			})
		})

		it("prevents duplicate tools", () => {
			const modeWithDuplicates = {
				slug: "test",
				name: "Test",
				roleDefinition: "Test",
				tools: [
					"read_file",
					"read_file",
					["write_to_file", { fileRegex: "\\.md$" }],
					["write_to_file", { fileRegex: "\\.txt$" }],
				],
			}

			expect(() => modeConfigSchema.parse(modeWithDuplicates)).toThrow(/Duplicate tools/)
		})
	})

	const validBaseMode = {
		slug: "123e4567-e89b-12d3-a456-426614174000",
		name: "Test Mode",
		roleDefinition: "Test role definition",
	}

	describe("tool format validation", () => {
		test("accepts single tool", () => {
			const mode = {
				...validBaseMode,
				tools: ["read_file"] as const,
			} satisfies ModeConfig

			expect(() => modeConfigSchema.parse(mode)).not.toThrow()
		})

		test("accepts multiple tools", () => {
			const mode = {
				...validBaseMode,
				tools: ["read_file", "write_to_file", "apply_diff"] as const,
			} satisfies ModeConfig

			expect(() => modeConfigSchema.parse(mode)).not.toThrow()
		})

		test("accepts all available tools", () => {
			const mode = {
				...validBaseMode,
				tools: ["read_file", "write_to_file", "apply_diff", "execute_command", "use_mcp_tool"] as const,
			} satisfies ModeConfig

			expect(() => modeConfigSchema.parse(mode)).not.toThrow()
		})

		test("rejects non-array tool format", () => {
			const mode = {
				...validBaseMode,
				tools: "not-an-array" as any,
			}

			expect(() => modeConfigSchema.parse(mode)).toThrow()
		})

		test("rejects invalid tool names", () => {
			const mode = {
				...validBaseMode,
				tools: ["invalid_tool"] as any,
			}

			expect(() => modeConfigSchema.parse(mode)).toThrow()
		})

		test("rejects duplicate tools", () => {
			const mode = {
				...validBaseMode,
				tools: ["read_file", "read_file"] as any,
			}

			expect(() => modeConfigSchema.parse(mode)).toThrow("Duplicate tools are not allowed")
		})

		test("rejects null or undefined tools", () => {
			const modeWithNull = {
				...validBaseMode,
				tools: null as any,
			}

			const modeWithUndefined = {
				...validBaseMode,
				tools: undefined as any,
			}

			expect(() => modeConfigSchema.parse(modeWithNull)).toThrow()
			expect(() => modeConfigSchema.parse(modeWithUndefined)).toThrow()
		})
	})
})
