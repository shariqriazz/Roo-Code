import { ToolArgs } from "./types"

export function getSearchAndReplaceDescription(args: ToolArgs): string {
	return `### \`search_and_replace\` - Pattern replacements
\`\`\`xml
<search_and_replace>
<path>file/path</path>
<search>find_text</search>
<replace>replace_text</replace>
<use_regex>true/false</use_regex>
<ignore_case>true/false</ignore_case>
<start_line>optional</start_line>
<end_line>optional</end_line>
</search_and_replace>
\`\`\``
}
