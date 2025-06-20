import { ToolArgs } from "./types"

export function getWriteToFileDescription(args: ToolArgs): string {
	return `### \`write_to_file\` - Create/overwrite files
\`\`\`xml
<write_to_file>
<path>file/path</path>
<content>COMPLETE file content</content>
<line_count>total_lines</line_count>
</write_to_file>
\`\`\``
}
