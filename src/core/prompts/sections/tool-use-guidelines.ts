import { CodeIndexManager } from "../../../services/code-index/manager"

export function getToolUseGuidelinesSection(codeIndexManager?: CodeIndexManager): string {
	const isCodebaseSearchAvailable =
		codeIndexManager &&
		codeIndexManager.isFeatureEnabled &&
		codeIndexManager.isFeatureConfigured &&
		codeIndexManager.isInitialized

	const guidelinesList: string[] = []
	let itemNumber = 1

	guidelinesList.push(
		`${itemNumber++}. In <thinking> tags, assess what information you already have and what information you need to proceed with the task.`,
	)

	if (isCodebaseSearchAvailable) {
		guidelinesList.push(
			`${itemNumber++}. **IMPORTANT: When starting a new task or when you need to understand existing code/functionality, you MUST use the \`codebase_search\` tool FIRST before any other search tools.** This semantic search tool helps you find relevant code based on meaning rather than just keywords. Only after using codebase_search should you use other tools like search_files, list_files, or read_file for more specific exploration.`,
		)
	}

	guidelinesList.push(
		`${itemNumber++}. Choose the most appropriate tool based on the task and the tool descriptions provided. Assess if you need additional information to proceed, and which of the available tools would be most effective for gathering this information. For example, using list_files is more effective than running \`ls\` in the terminal.`,
	)
	guidelinesList.push(
		`${itemNumber++}. If multiple actions are needed, use one tool at a time per message to accomplish the task iteratively, with each tool use being informed by the result of the previous tool use. Do not assume the outcome of any tool use.`,
	)
	guidelinesList.push(`${itemNumber++}. Formulate your tool use using the XML format specified for each tool.`)
	guidelinesList.push(`${itemNumber++}. After each tool use, the user will respond with results that may include:
   - Success or failure information with reasons
   - Linter errors to address
   - Terminal output to consider
   - Other relevant feedback`)
	guidelinesList.push(
		`${itemNumber++}. ALWAYS wait for user confirmation after each tool use before proceeding. Never assume success without explicit confirmation.`,
	)

	return `# Tool Use Guidelines

${guidelinesList.join("\n")}

This step-by-step approach allows you to:
1. Confirm the success of each step before proceeding
2. Address issues immediately
3. Adapt to new information
4. Build each action correctly on previous ones

This iterative process ensures overall success and accuracy.`
}
