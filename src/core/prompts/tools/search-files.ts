import { ToolArgs } from "./types"

export function getSearchFilesDescription(args: ToolArgs): string {
	return `### \`search_files\` - Pattern-based code discovery
\`\`\`xml
<search_files>
<path>search/directory</path>
<regex>pattern</regex>
<file_pattern>*.ext</file_pattern>
</search_files>
\`\`\``
}
