import { ToolArgs } from "./types"

export function getListCodeDefinitionNamesDescription(args: ToolArgs): string {
	return `### \`list_code_definition_names\` - Extract code architecture
	\`\`\`xml
	<list_code_definition_names>
	<path>file/or/directory</path>
	</list_code_definition_names>
	\`\`\``
}
