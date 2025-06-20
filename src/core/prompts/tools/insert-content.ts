import { ToolArgs } from "./types"

export function getInsertContentDescription(args: ToolArgs): string {
	return `### \`insert_content\` - Add new lines (line 0 = append, positive = insert before)
\`\`\`xml
<insert_content>
<path>file/path</path>
<line>line_number</line>
<content>new content</content>
</insert_content>
\`\`\``
}
