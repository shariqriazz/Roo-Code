import { ToolArgs } from "./types"

export function getExecuteCommandDescription(_args: ToolArgs): string | undefined {
	return `## execute_command
Description: Execute CLI commands on the user's system
Parameters:
- command: (required) Valid CLI command
- cwd: (optional) Working directory for execution

Example:
<execute_command>
<command>npm run dev</command>
</execute_command>`
}
