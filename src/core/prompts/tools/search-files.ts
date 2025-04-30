import { ToolArgs } from "./types"
import { PARAMETER_DESCRIPTIONS } from "../constants"

export function getSearchFilesDescription(args: ToolArgs): string {
	return `## search_files
Description: Search files using regex patterns across a directory
Parameters:
- path: (required) Directory to search in ${PARAMETER_DESCRIPTIONS.PATH(args.cwd)}
- regex: (required) Regular expression pattern
- file_pattern: (optional) Glob pattern to filter files

Example:
<search_files>
<path>src</path>
<regex>function\\s+findUser</regex>
<file_pattern>*.ts</file_pattern>
</search_files>`
}
