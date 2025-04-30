import { ToolArgs } from "./types"
import { PARAMETER_DESCRIPTIONS } from "../constants"

export function getListCodeDefinitionNamesDescription(args: ToolArgs): string {
	return `## list_code_definition_names
Description: Extract structure by listing all code definitions
Parameters:
- path: (required) ${PARAMETER_DESCRIPTIONS.PATH(args.cwd)} to analyze

Examples:
<list_code_definition_names>
<path>src/main.ts</path>
</list_code_definition_names>

<list_code_definition_names>
<path>src/components</path>
</list_code_definition_names>`
}
