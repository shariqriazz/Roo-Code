import { ToolArgs } from "./types"

export function getBrowserActionDescription(args: ToolArgs): string | undefined {
	if (!args.supportsComputerUse) {
		return undefined
	}
	return `## browser_action
Description: Control a Puppeteer browser to interact with websites
Requirements:
- **Always start with launch** and **end with close**
- Use one action per message
- Browser resolution: **${args.browserViewportSize}** pixels

Parameters:
- action: (required) launch, click, hover, type, resize, scroll_down/up, close
- Other parameters based on action (url, coordinate, size, text)

Examples:
<browser_action>
<action>launch</action>
<url>http://localhost:3000</url>
</browser_action>

<browser_action>
<action>click</action>
<coordinate>450,300</coordinate>
</browser_action>`
}
