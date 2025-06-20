import { ToolArgs } from "./types"

export function getInsertContentDescription(args: ToolArgs): string {
	return `### \`insert_content\` - Add new lines
\`\`\`xml
<insert_content>
<path>file/path</path>
<line>line_number</line>
<content>new content</content>
</insert_content>
\`\`\`
**BEST PRACTICE:** Use \`read_file\` first to see exact content with line numbers before inserting new content.`
}
