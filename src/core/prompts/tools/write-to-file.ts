import { ToolArgs } from "./types"
import { FILE_CONTENT_WARNING, PARAMETER_DESCRIPTIONS } from "../constants"

export function getWriteToFileDescription(args: ToolArgs): string {
	return `## write_to_file
Description: Write or overwrite a file at the specified path
Parameters:
- path: (required) ${PARAMETER_DESCRIPTIONS.PATH(args.cwd)}
- content: (required) ${FILE_CONTENT_WARNING}
- line_count: (required) Total number of lines in the file

Example:
<write_to_file>
<path>config.json</path>
<content>
{
	 "apiEndpoint": "https://api.example.com",
	 "version": "1.0.0",
	 "features": {
	   "darkMode": true
	 }
}
</content>
<line_count>7</line_count>
</write_to_file>`
}
