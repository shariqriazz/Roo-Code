import { ToolArgs } from "./types"

export function getNewTaskDescription(_args: ToolArgs): string {
	return `### \`new_task\` - Create new specialized task instances
\`\`\`xml
<new_task>
<mode>target_mode</mode>
<message>task_instructions</message>
</new_task>
\`\`\``
}
