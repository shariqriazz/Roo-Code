export function getSwitchModeDescription(): string {
	return `## switch_mode
Description: Switch to a different mode for specialized capabilities
Parameters:
- mode_slug: (required) Target mode identifier
- reason: (optional) Justification for mode switch

Example:
<switch_mode>
<mode_slug>code</mode_slug>
<reason>Need to implement authentication system</reason>
</switch_mode>`
}
