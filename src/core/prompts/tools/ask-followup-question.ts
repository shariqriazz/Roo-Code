export function getAskFollowupQuestionDescription(): string {
	return `## ask_followup_question
Description: Ask for clarification when information is missing
Parameters:
- question: (required) Clear, specific question
- follow_up: (required) 2-4 suggested answers in <suggest> tags

Example:
<ask_followup_question>
<question>Where is the configuration file located?</question>
<follow_up>
<suggest>./src/config.json</suggest>
<suggest>./config/settings.json</suggest>
</follow_up>
</ask_followup_question>`
}
