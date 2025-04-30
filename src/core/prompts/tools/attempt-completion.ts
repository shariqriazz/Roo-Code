export function getAttemptCompletionDescription(): string {
	return `## attempt_completion
Description: Present final task results after confirming success
Parameters:
- result: (required) Final task result
- command: (optional) CLI command to demonstrate results

Example:
<attempt_completion>
<result>
I've implemented the login component with form validation.
</result>
<command>npm start</command>
</attempt_completion>`
}
