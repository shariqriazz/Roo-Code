import { ToolArgs } from "./types"

export function getListFilesDescription(args: ToolArgs): string {
	return `### \`list_files\` - Directory structure exploration
\`\`\`xml
<list_files>
<path>directory/path</path>
<recursive>true/false</recursive>
</list_files>
\`\`\``
}
