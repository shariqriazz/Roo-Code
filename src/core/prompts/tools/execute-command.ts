import { ToolArgs } from "./types"

export function getExecuteCommandDescription(args: ToolArgs): string | undefined {
	return `### \`execute_command\` - CLI command execution
\`\`\`xml
<execute_command>
<command>command_to_run</command>
<cwd>optional_directory</cwd>
</execute_command>
\`\`\``
}
