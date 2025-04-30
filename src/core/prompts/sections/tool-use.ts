import { TOOL_USE_FORMAT } from "../constants"

export function getSharedToolUseSection(): string {
	return `====

TOOL USE

You have access to tools that execute upon user approval. Use one tool per message, and receive results in the user's response. Use tools step-by-step to accomplish tasks, with each use informed by previous results.

# Tool Use Formatting

${TOOL_USE_FORMAT}

Example:

<read_file>
<path>src/main.js</path>
</read_file>

Always adhere to this format for the tool use to ensure proper parsing and execution.`
}
