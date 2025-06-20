import { EXPERIMENT_IDS, experiments } from "../../../shared/experiments"
import { CodeIndexManager } from "../../../services/code-index/manager"

export function getObjectiveSection(
	codeIndexManager?: CodeIndexManager,
	experimentsConfig?: Record<string, boolean>,
): string {
	const isCodebaseSearchAvailable =
		codeIndexManager &&
		codeIndexManager.isFeatureEnabled &&
		codeIndexManager.isFeatureConfigured &&
		codeIndexManager.isInitialized

	const codebaseSearchInstruction = isCodebaseSearchAvailable
		? `\n   • Use \`codebase_search\` for semantic code discovery before other tools`
		: ""

	// Check if command execution is disabled via experiment
	const isCommandDisabled = experimentsConfig && experimentsConfig[EXPERIMENT_IDS.DISABLE_COMPLETION_COMMAND]

	const commandInstruction = !isCommandDisabled ? " with an optional demo command" : ""

	return `====

OBJECTIVE

Approach tasks systematically by breaking them into clear, sequential steps.

1. Analyze the task and set prioritized, achievable goals
2. Work through goals methodically, using one tool at a time
3. Before using tools:
   • Use <thinking> tags to analyze available information${codebaseSearchInstruction}
   • Select the most appropriate tool for the current step
   • Verify all required parameters are available or can be inferred
   • If parameters are missing, use ask_followup_question instead
4. Present results with attempt_completion${commandInstruction} when task is complete
5. Respond to feedback constructively without unnecessary conversation`
}
