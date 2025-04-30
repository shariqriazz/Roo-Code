import os from "os"
import osName from "os-name"
import { Mode, ModeConfig } from "../../../shared/modes"
import { getShell } from "../../../utils/shell"
import { WORKSPACE_DIR_EXPLANATION } from "../constants"

/**
 * Generate the system information section for the prompt
 * @param cwd - Current workspace directory
 * @param currentMode - Current active mode
 * @param customModes - Custom mode configurations
 * @returns Formatted system information section
 */
export function getSystemInfoSection(_cwd: string, _currentMode: Mode, _customModes?: ModeConfig[]): string {
	return `====

SYSTEM INFORMATION

Operating System: ${osName()}
Default Shell: ${getShell()}
Home Directory: ${os.homedir().toPosix()}
Current Workspace Directory:

${WORKSPACE_DIR_EXPLANATION} New terminals start here. For directories outside workspace, use list_files with recursive=true for full listing or false for top-level contents.`
}
