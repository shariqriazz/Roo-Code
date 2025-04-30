import { ToolArgs } from "./types"
import { PARAMETER_DESCRIPTIONS } from "../constants"

export function getSearchAndReplaceDescription(args: ToolArgs): string {
	return `## search_and_replace
Description: Find and replace text or patterns in files

Parameters:
- path: (required) ${PARAMETER_DESCRIPTIONS.PATH(args.cwd.toPosix())}
- search: (required) Text or pattern to find
- replace: (required) Replacement text
- use_regex, ignore_case, start_line, end_line: (optional)

Example:
<search_and_replace>
<path>example.ts</path>
<search>oldText</search>
<replace>newText</replace>
</search_and_replace>`
}
