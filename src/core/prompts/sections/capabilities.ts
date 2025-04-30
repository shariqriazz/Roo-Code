import { DiffStrategy } from "../../../shared/tools"
import { McpHub } from "../../../services/mcp/McpHub"

export function getCapabilitiesSection(
	cwd: string,
	supportsComputerUse: boolean,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
): string {
	return `====

CAPABILITIES

- Tools for CLI commands, file operations, code analysis${
		supportsComputerUse ? ", browser interaction" : ""
	}, and follow-up questions.

- Receive recursive file list from workspace '${cwd}' in environment_details. For directories outside the workspace, use list_files with recursive=true for full listing or recursive=false for top-level contents.

- Key analysis tools:
	 • search_files: Find patterns across files with context
	 • list_code_definition_names: Extract code structure from files or directories
	 • read_file: Examine specific files with line numbers for reference
	 • ${diffStrategy ? "apply_diff/write_to_file" : "write_to_file"}: Apply changes after analysis

- execute_command runs CLI commands with explanations${
		supportsComputerUse ? "\n\n- browser_action interacts with websites and local servers" : ""
	}${mcpHub ? `\n\n- MCP servers provide specialized tools for specific tasks` : ""}`
}
