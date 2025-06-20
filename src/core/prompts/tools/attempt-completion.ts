import { EXPERIMENT_IDS, experiments } from "../../../shared/experiments"
import { ToolArgs } from "./types"

export function getAttemptCompletionDescription(args?: ToolArgs): string {
	// Check if command execution is disabled via experiment
	const isCommandDisabled =
		args?.experiments && experiments.isEnabled(args.experiments, EXPERIMENT_IDS.DISABLE_COMPLETION_COMMAND)

	const baseDescription = `### \`attempt_completion\` - Present final engineering results
\`\`\`xml
<attempt_completion>
<result>comprehensive_solution_summary</result>
<command>optional_demo_command</command>
</attempt_completion>
\`\`\``

	return baseDescription
}
