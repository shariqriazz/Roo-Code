import { TOOL_USE_GUIDELINES } from "../constants"

export function getToolUseGuidelinesSection(): string {
	return `# Tool Use Guidelines

1. ${TOOL_USE_GUIDELINES[0]}
2. ${TOOL_USE_GUIDELINES[1]}
3. ${TOOL_USE_GUIDELINES[2]}
4. ${TOOL_USE_GUIDELINES[3]}
5. After each tool use, wait for user response with results
6. ${TOOL_USE_GUIDELINES[4]}

This step-by-step approach allows you to:
1. Confirm the success of each step before proceeding
2. Address issues immediately
3. Adapt to new information
4. Build each action correctly on previous ones`
}
