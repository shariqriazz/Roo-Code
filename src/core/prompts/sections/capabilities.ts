import { DiffStrategy } from "../../../shared/tools"
import { McpHub } from "../../../services/mcp/McpHub"
import { CodeIndexManager } from "../../../services/code-index/manager"

export function getCapabilitiesSection(
	cwd: string,
	supportsComputerUse: boolean,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	codeIndexManager?: CodeIndexManager,
): string {
	const isCodebaseSearchAvailable =
		codeIndexManager &&
		codeIndexManager.isFeatureEnabled &&
		codeIndexManager.isFeatureConfigured &&
		codeIndexManager.isInitialized

	return `====

CAPABILITIES

- You have access to tools for CLI commands, file operations, code analysis${
		supportsComputerUse ? ", browser interaction" : ""
	}, and follow-up questions.
${
	isCodebaseSearchAvailable
		? `\n- You can use the \`codebase_search\` tool to perform semantic searches across your entire codebase. This tool is powerful for finding functionally relevant code, even if you don't know the exact keywords or file names. It's particularly useful for understanding how features are implemented across multiple files, discovering usages of a particular API, or finding code examples related to a concept. This capability relies on a pre-built index of your code.`
		: ""
}
- When a task begins, you'll receive a recursive file list from workspace '${cwd}' in environment_details. This shows project structure, file organization, and programming languages. For directories outside the workspace, use list_files with recursive=true for full listing or recursive=false for top-level contents.

- Key analysis tools:
  • search_files: Find patterns across files with context
  • list_code_definition_names: Extract code structure from files or directories
  • read_file: Examine specific files with line numbers for reference
  • ${diffStrategy ? "apply_diff/write_to_file" : "write_to_file"}: Apply changes after analysis

- The execute_command tool runs CLI commands with clear explanations. Complex commands are preferred over scripts. Commands run in new terminal instances, and long-running processes can continue in the background.${
		supportsComputerUse
			? "\n\n- The browser_action tool lets you interact with websites and local servers. Launch browsers, navigate, click elements, and analyze screenshots and console output. Useful for testing web applications and verifying functionality."
			: ""
	}${mcpHub ? `\n\n- MCP servers provide additional specialized tools and resources for specific tasks.` : ""}`
}
