import { ToolArgs } from "./types"

export function getAccessMcpResourceDescription(args: ToolArgs): string | undefined {
	if (!args.mcpHub) {
		return undefined
	}
	return `### \`access_mcp_resource\` - Access MCP server resources
\`\`\`xml
<access_mcp_resource>
<server_name>server_name</server_name>
<uri>resource_uri</uri>
</access_mcp_resource>
\`\`\``
}
