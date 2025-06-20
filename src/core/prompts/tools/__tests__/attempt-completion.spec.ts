import { getAttemptCompletionDescription } from "../attempt-completion"
import { EXPERIMENT_IDS } from "../../../../shared/experiments"

describe("getAttemptCompletionDescription - DISABLE_COMPLETION_COMMAND experiment", () => {
	describe("when experiment is disabled (default)", () => {
		it("should include command parameter in the description", () => {
			const args = {
				cwd: "/test/path",
				supportsComputerUse: false,
				experiments: {
					[EXPERIMENT_IDS.DISABLE_COMPLETION_COMMAND]: false,
				},
			}

			const description = getAttemptCompletionDescription(args)

			// Check that command parameter is included
			expect(description).toContain("<command>optional_demo_command</command>")
		})

		it("should include command parameter when experiments is undefined", () => {
			const args = {
				cwd: "/test/path",
				supportsComputerUse: false,
			}

			const description = getAttemptCompletionDescription(args)

			// Check that command parameter is included
			expect(description).toContain("<command>optional_demo_command</command>")
		})

		it("should include command parameter when no args provided", () => {
			const description = getAttemptCompletionDescription()

			// Check that command parameter is included
			expect(description).toContain("<command>optional_demo_command</command>")
		})
	})

	describe("when experiment is enabled", () => {
		it("should NOT include command parameter in the description", () => {
			const args = {
				cwd: "/test/path",
				supportsComputerUse: false,
				experiments: {
					[EXPERIMENT_IDS.DISABLE_COMPLETION_COMMAND]: true,
				},
			}

			const description = getAttemptCompletionDescription(args)

			// Check that command parameter is NOT included
			expect(description).not.toContain("- command: (optional)")
			expect(description).not.toContain("A CLI command to execute to show a live demo")
			expect(description).not.toContain("<command>Command to demonstrate result (optional)</command>")
			expect(description).not.toContain("<command>open index.html</command>")

			// But should still have the basic structure
			expect(description).toContain("### `attempt_completion` - Present final results")
			expect(description).toContain("<result>comprehensive_solution_summary</result>")
			expect(description).toContain("<attempt_completion>")
			expect(description).toContain("</attempt_completion>")
		})

		it("should show example without command", () => {
			const args = {
				cwd: "/test/path",
				supportsComputerUse: false,
				experiments: {
					[EXPERIMENT_IDS.DISABLE_COMPLETION_COMMAND]: true,
				},
			}

			const description = getAttemptCompletionDescription(args)

			// Check example format
			expect(description).not.toContain("<command>optional_demo_command</command>")
		})
	})

	describe("description content", () => {
		it("should maintain core functionality description regardless of experiment", () => {
			const argsWithExperimentDisabled = {
				cwd: "/test/path",
				supportsComputerUse: false,
				experiments: {
					[EXPERIMENT_IDS.DISABLE_COMPLETION_COMMAND]: false,
				},
			}

			const argsWithExperimentEnabled = {
				cwd: "/test/path",
				supportsComputerUse: false,
				experiments: {
					[EXPERIMENT_IDS.DISABLE_COMPLETION_COMMAND]: true,
				},
			}

			const descriptionDisabled = getAttemptCompletionDescription(argsWithExperimentDisabled)
			const descriptionEnabled = getAttemptCompletionDescription(argsWithExperimentEnabled)

			// Both should contain core functionality
			const coreText = "### `attempt_completion` - Present final results"
			expect(descriptionDisabled).toContain(coreText)
			expect(descriptionEnabled).toContain(coreText)

			// Both should contain result parameter
			expect(descriptionDisabled).toContain("<result>comprehensive_solution_summary</result>")
			expect(descriptionEnabled).toContain("<result>comprehensive_solution_summary</result>")
		})
	})
})
