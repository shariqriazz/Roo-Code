import { ToolArgs } from "./types"
import { PARAMETER_DESCRIPTIONS } from "../constants"

export function getReadFileDescription(args: ToolArgs): string {
	return `## read_file
Description: Read file contents with line numbers. Supports partial file reading and extracts text from PDF/DOCX files.
Parameters:
- path: (required) ${PARAMETER_DESCRIPTIONS.PATH(args.cwd)}
- start_line: (optional) Starting line number (1-based)
- end_line: (optional) Ending line number (1-based, inclusive)

Examples:
<read_file>
<path>frontend-config.json</path>
</read_file>

<read_file>
<path>data/large-dataset.csv</path>
<start_line>500</start_line>
<end_line>1000</end_line>
</read_file>`
}
