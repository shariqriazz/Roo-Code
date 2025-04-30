import { DiffStrategy } from "../../../shared/tools"
import { FILE_CONTENT_WARNING } from "../constants"

function getEditingInstructions(diffStrategy?: DiffStrategy, _experiments?: Record<string, boolean>): string {
	const instructions: string[] = []
	const availableTools: string[] = []

	// Collect available editing tools
	if (diffStrategy) {
		availableTools.push(
			"apply_diff (for targeted line replacements)",
			"write_to_file (for creating/rewriting files)",
		)
	} else {
		availableTools.push("write_to_file (for creating/rewriting files)")
	}

	availableTools.push("insert_content (for adding lines)")
	availableTools.push("search_and_replace (for text replacements)")

	// Base editing instruction
	instructions.push(`- For editing files: ${availableTools.join(", ")}`)

	// Tool preferences and warnings
	if (availableTools.length > 1) {
		const preferredTools = diffStrategy
			? "(apply_diff, insert_content, search_and_replace)"
			: "(insert_content, search_and_replace)"
		instructions.push(`- Prefer targeted tools ${preferredTools} over write_to_file for existing files`)
	}

	instructions.push("- When using write_to_file: " + FILE_CONTENT_WARNING)

	return instructions.join("\n")
}

export function getRulesSection(cwd: string, supportsComputerUse: boolean, diffStrategy?: DiffStrategy): string {
	return `====

RULES

- Base directory: All paths must be relative to this directory
- No \`cd\` commands; combine with commands: \`cd /target/dir && command\`
- Use search_files with balanced regex, then read_file before making changes
- When creating projects, use logical directory structure following best practices
${getEditingInstructions(diffStrategy)}
- Consider project type and compatibility with existing codebase
- Use available tools before asking questions
- Use ask_followup_question sparingly with 2-4 specific suggestions
- Use attempt_completion for final results
- Write direct, technical responses
- Check "Actively Running Terminals" before launching duplicate processes
- NEVER use long-running commands with attempt_completion
- Always wait for user confirmation after each tool use${
		supportsComputerUse ? "\n- For non-development tasks, use browser_action when appropriate" : ""
	}`
}
