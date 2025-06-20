import { ToolArgs } from "./types"

export function getUseMcpToolDescription(args: ToolArgs): string | undefined {
	if (!args.mcpHub) {
		return undefined
	}
	return `### \`use_mcp_tool\` - Execute specialized MCP tools
\`\`\`xml
<use_mcp_tool>
<server_name>mcp_server_name</server_name>
<tool_name>tool_to_execute</tool_name>
<arguments>
{
	 "parameter1": "value1",
	 "parameter2": "value2"
}
</arguments>
</use_mcp_tool>
\`\`\``
}
