import { ToolArgs } from "./types"

/**
 * Generate description for the new_task tool
 * @param args Tool arguments
 * @returns Tool description
 */
export function getNewTaskDescription(_args: ToolArgs): string {
	return `## new_task
Description: Create a new task instance with specified mode
Parameters:
- mode: (required) Target mode identifier
- message: (required) Initial instruction or query

Example:
<new_task>
<mode>code</mode>
<message>Create a React component for a paginated user table.</message>
</new_task>
`
}
