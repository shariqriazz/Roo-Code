import { ToolArgs } from "./types"

export function getReadFileDescription(args: ToolArgs): string {
	const maxConcurrentReads = args.settings?.maxConcurrentFileReads ?? 5
	const isMultipleReadsEnabled = maxConcurrentReads > 1

	return `### \`read_file\` - Examine file contents (up to ${maxConcurrentReads} files)
\`\`\`xml
<read_file>
<args>
	 <file>
	   <path>relative/path/to/file</path>
	 </file>
	 <file>
	   <path>another/file/path</path>
	 </file>
</args>
</read_file>
\`\`\``
}
