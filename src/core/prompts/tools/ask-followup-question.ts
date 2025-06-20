export function getAskFollowupQuestionDescription(): string {
	return `### \`ask_followup_question\` - Strategic requirement clarification
\`\`\`xml
<ask_followup_question>
<question>specific_clarifying_question</question>
<follow_up>
<suggest>complete_option_1</suggest>
<suggest>complete_option_2</suggest>
<suggest>complete_option_3</suggest>
</follow_up>
</ask_followup_question>
\`\`\``
}
