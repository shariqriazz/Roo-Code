import { ToolArgs } from "./types"

export function getBrowserActionDescription(args: ToolArgs): string | undefined {
	if (!args.supportsComputerUse) {
		return undefined
	}
	return `### \`browser_action\` - Web automation and testing
\`\`\`xml
<browser_action>
<action>launch/click/hover/type/scroll_down/scroll_up/resize/close</action>
<url>http://target.url</url>
<coordinate>x,y</coordinate>
<text>text_to_type</text>
<size>width,height</size>
</browser_action>
\`\`\``
}
