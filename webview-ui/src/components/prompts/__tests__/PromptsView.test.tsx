import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import PromptsView from "../PromptsView"
import { ExtensionStateContext } from "@src/context/ExtensionStateContext"
import { vscode } from "@src/utils/vscode"

// Mock vscode API
jest.mock("@src/utils/vscode", () => ({
	vscode: {
		postMessage: jest.fn(),
	},
}))

const mockExtensionState = {
	customModePrompts: {},
	listApiConfigMeta: [
		{ id: "config1", name: "Config 1" },
		{ id: "config2", name: "Config 2" },
	],
	enhancementApiConfigId: "",
	setEnhancementApiConfigId: jest.fn(),
	mode: "code",
	customInstructions: "Initial instructions",
	setCustomInstructions: jest.fn(),
	customModes: [], // Add customModes to mockExtensionState
}

const renderPromptsView = (props = {}) => {
	const mockOnDone = jest.fn()
	return render(
		<ExtensionStateContext.Provider value={{ ...mockExtensionState, ...props } as any}>
			<PromptsView onDone={mockOnDone} />
		</ExtensionStateContext.Provider>,
	)
}

describe("PromptsView", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it("renders all mode tabs", () => {
		renderPromptsView()
		expect(screen.getByTestId("code-tab")).toBeInTheDocument()
		expect(screen.getByTestId("ask-tab")).toBeInTheDocument()
		expect(screen.getByTestId("architect-tab")).toBeInTheDocument()
	})

	it("defaults to current mode as active tab", () => {
		renderPromptsView({ mode: "ask" })

		const codeTab = screen.getByTestId("code-tab")
		const askTab = screen.getByTestId("ask-tab")
		const architectTab = screen.getByTestId("architect-tab")

		expect(askTab).toHaveAttribute("data-active", "true")
		expect(codeTab).toHaveAttribute("data-active", "false")
		expect(architectTab).toHaveAttribute("data-active", "false")
	})

	it("switches between tabs correctly", async () => {
		const { rerender } = render(
			<ExtensionStateContext.Provider value={{ ...mockExtensionState, mode: "code" } as any}>
				<PromptsView onDone={jest.fn()} />
			</ExtensionStateContext.Provider>,
		)

		const codeTab = screen.getByTestId("code-tab")
		const askTab = screen.getByTestId("ask-tab")
		const architectTab = screen.getByTestId("architect-tab")

		// Initial state matches current mode (code)
		expect(codeTab).toHaveAttribute("data-active", "true")
		expect(askTab).toHaveAttribute("data-active", "false")
		expect(architectTab).toHaveAttribute("data-active", "false")

		// Click Ask tab and update context
		fireEvent.click(askTab)
		rerender(
			<ExtensionStateContext.Provider value={{ ...mockExtensionState, mode: "ask" } as any}>
				<PromptsView onDone={jest.fn()} />
			</ExtensionStateContext.Provider>,
		)

		expect(askTab).toHaveAttribute("data-active", "true")
		expect(codeTab).toHaveAttribute("data-active", "false")
		expect(architectTab).toHaveAttribute("data-active", "false")

		// Click Architect tab and update context
		fireEvent.click(architectTab)
		rerender(
			<ExtensionStateContext.Provider value={{ ...mockExtensionState, mode: "architect" } as any}>
				<PromptsView onDone={jest.fn()} />
			</ExtensionStateContext.Provider>,
		)

		expect(architectTab).toHaveAttribute("data-active", "true")
		expect(askTab).toHaveAttribute("data-active", "false")
		expect(codeTab).toHaveAttribute("data-active", "false")
	})

	it("handles prompt changes correctly", async () => {
		renderPromptsView()

		// Get the textarea
		const textarea = await waitFor(() => screen.getByTestId("code-prompt-textarea"))
		fireEvent.change(textarea, {
			target: { value: "New prompt value" },
		})

		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "updatePrompt",
			promptMode: "code",
			customPrompt: { roleDefinition: "New prompt value" },
		})
	})

	it("resets role definition only for built-in modes", async () => {
		const customMode = {
			slug: "custom-mode",
			name: "Custom Mode",
			roleDefinition: "Custom role",
			groups: [],
		}

		// Test with built-in mode (code)
		const { unmount } = render(
			<ExtensionStateContext.Provider
				value={{ ...mockExtensionState, mode: "code", customModes: [customMode] } as any}>
				<PromptsView onDone={jest.fn()} />
			</ExtensionStateContext.Provider>,
		)

		// Find and click the role definition reset button
		const resetButton = screen.getByTestId("role-definition-reset")
		expect(resetButton).toBeInTheDocument()
		await fireEvent.click(resetButton)

		// Verify it only resets role definition
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "updatePrompt",
			promptMode: "code",
			customPrompt: { roleDefinition: undefined },
		})

		// Cleanup before testing custom mode
		unmount()

		// Test with custom mode
		render(
			<ExtensionStateContext.Provider
				value={{ ...mockExtensionState, mode: "custom-mode", customModes: [customMode] } as any}>
				<PromptsView onDone={jest.fn()} />
			</ExtensionStateContext.Provider>,
		)

		// Verify reset button is not present for custom mode
		expect(screen.queryByTestId("role-definition-reset")).not.toBeInTheDocument()
	})

	it("handles API configuration selection", async () => {
		renderPromptsView()

		// Click the ENHANCE tab first to show the API config dropdown
		const enhanceTab = screen.getByTestId("ENHANCE-tab")
		fireEvent.click(enhanceTab)

		// Wait for the ENHANCE tab click to take effect
		const dropdown = await waitFor(() => screen.getByTestId("api-config-dropdown"))
		fireEvent.change(dropdown, {
			target: { value: "config1" },
		})

		expect(mockExtensionState.setEnhancementApiConfigId).toHaveBeenCalledWith("config1")
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "enhancementApiConfigId",
			text: "config1",
		})
	})

	it("handles clearing custom instructions correctly", async () => {
		const setCustomInstructions = jest.fn()
		renderPromptsView({
			...mockExtensionState,
			customInstructions: "Initial instructions",
			setCustomInstructions,
		})

		const textarea = screen.getByTestId("global-custom-instructions-textarea")
		fireEvent.change(textarea, {
			target: { value: "" },
		})

		expect(setCustomInstructions).toHaveBeenCalledWith(undefined)
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "customInstructions",
			text: undefined,
		})
	})

	// Test for Rules section
	it("handles rules changes correctly for built-in mode", async () => {
		renderPromptsView({ mode: "code", customModePrompts: { code: { rules: "Initial rules" } } })
		const textarea = await screen.findByTestId("code-rules-textarea")
		expect(textarea).toHaveValue("Initial rules")
		fireEvent.change(textarea, { target: { value: "New rules value" } })
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "updatePrompt",
			promptMode: "code",
			customPrompt: { rules: "New rules value" },
		})
	})

	it("handles rules changes correctly for custom mode", async () => {
		const customMode = {
			slug: "custom-test",
			name: "Custom Test",
			roleDefinition: "Custom role",
			rules: "Initial custom rules",
			groups: [],
			source: "global",
		}
		renderPromptsView({ mode: "custom-test", customModes: [customMode] })
		const textarea = await screen.findByTestId("custom-test-rules-textarea")
		expect(textarea).toHaveValue("Initial custom rules")
		fireEvent.change(textarea, { target: { value: "New custom rules value" } })
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "updateCustomMode",
			slug: "custom-test",
			modeConfig: { ...customMode, rules: "New custom rules value" },
		})
	})

	it("resets rules only for built-in modes", async () => {
		const customMode = { slug: "custom-r", name: "Custom R", roleDefinition: "Def", groups: [] }
		const { unmount, rerender } = renderPromptsView({
			mode: "code",
			customModes: [customMode],
			customModePrompts: { code: { rules: "User rules" } },
		})
		const resetButton = screen.getByTestId("code-rules-reset")
		expect(resetButton).toBeInTheDocument()
		fireEvent.click(resetButton)
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "updatePrompt",
			promptMode: "code",
			customPrompt: { rules: undefined },
		})
		unmount()

		// Switch to custom mode
		rerender(
			<ExtensionStateContext.Provider
				value={{ ...mockExtensionState, mode: "custom-r", customModes: [customMode] } as any}>
				<PromptsView onDone={jest.fn()} />
			</ExtensionStateContext.Provider>,
		)
		expect(screen.queryByTestId("custom-r-rules-reset")).not.toBeInTheDocument()
	})

	it('triggers openFile for rules "Load from file" link', async () => {
		renderPromptsView({ mode: "code" })
		const loadFromFileLink = screen.getByText(/Mode-specific rules for Code mode can also be loaded from/i)
		const spanElement = loadFromFileLink.querySelector("span") // Find the clickable span
		expect(spanElement).toBeInTheDocument()
		if (spanElement) fireEvent.click(spanElement)

		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "openFile",
			text: "./.roo/rules-code/mode_rules.md",
			values: { create: true, content: "" },
		})
	})

	// Test for Objective section
	it("handles objective changes correctly for built-in mode", async () => {
		renderPromptsView({ mode: "ask", customModePrompts: { ask: { objective: "Initial objective" } } })
		const textarea = await screen.findByTestId("ask-objective-textarea")
		expect(textarea).toHaveValue("Initial objective")
		fireEvent.change(textarea, { target: { value: "New objective value" } })
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "updatePrompt",
			promptMode: "ask",
			customPrompt: { objective: "New objective value" },
		})
	})

	it("handles objective changes correctly for custom mode", async () => {
		const customMode = {
			slug: "custom-obj",
			name: "Custom Obj",
			roleDefinition: "Custom role obj",
			objective: "Initial custom objective",
			groups: [],
			source: "global",
		}
		renderPromptsView({ mode: "custom-obj", customModes: [customMode] })
		const textarea = await screen.findByTestId("custom-obj-objective-textarea")
		expect(textarea).toHaveValue("Initial custom objective")
		fireEvent.change(textarea, { target: { value: "New custom objective value" } })
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "updateCustomMode",
			slug: "custom-obj",
			modeConfig: { ...customMode, objective: "New custom objective value" },
		})
	})

	it("resets objective only for built-in modes", async () => {
		const customMode = { slug: "custom-o", name: "Custom O", roleDefinition: "Def", groups: [] }
		const { unmount, rerender } = renderPromptsView({
			mode: "ask",
			customModes: [customMode],
			customModePrompts: { ask: { objective: "User objective" } },
		})
		const resetButton = screen.getByTestId("ask-objective-reset")
		expect(resetButton).toBeInTheDocument()
		fireEvent.click(resetButton)
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "updatePrompt",
			promptMode: "ask",
			customPrompt: { objective: undefined },
		})
		unmount()

		rerender(
			<ExtensionStateContext.Provider
				value={{ ...mockExtensionState, mode: "custom-o", customModes: [customMode] } as any}>
				<PromptsView onDone={jest.fn()} />
			</ExtensionStateContext.Provider>,
		)
		expect(screen.queryByTestId("custom-o-objective-reset")).not.toBeInTheDocument()
	})

	it('triggers openFile for objective "Load from file" link', async () => {
		renderPromptsView({ mode: "ask" })
		const loadFromFileLink = screen.getByText(/The mode-specific objective for Ask mode can also be loaded from/i)
		const spanElement = loadFromFileLink.querySelector("span")
		expect(spanElement).toBeInTheDocument()
		if (spanElement) fireEvent.click(spanElement)

		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "openFile",
			text: "./.roo/rules-ask/mode_objective.md",
			values: { create: true, content: "" },
		})
	})

	describe("Create New Mode Dialog", () => {
		it("includes rules and objective fields and sends them on create", async () => {
			renderPromptsView()
			const createButton = screen.getByTitle("Create new mode")
			fireEvent.click(createButton)

			// Wait for dialog to appear
			const nameInput = await screen.findByText("Name", { selector: "div > div" }) // More specific selector
			expect(nameInput).toBeInTheDocument()

			// Fill out the form
			const dialogNameInput = nameInput.parentElement?.querySelector("vscode-text-field")
			const dialogSlugInput = screen
				.getByText("Slug", { selector: "div > div" })
				.parentElement?.querySelector("vscode-text-field")
			const dialogRoleTextarea = screen
				.getByText("Role Definition", { selector: "div > div" })
				.parentElement?.querySelector("vscode-textarea")
			const dialogRulesTextarea = screen
				.getByText("Rules (optional)", { selector: "div > div" })
				.parentElement?.querySelector("vscode-textarea")
			const dialogObjectiveTextarea = screen
				.getByText("Objective (optional)", { selector: "div > div" })
				.parentElement?.querySelector("vscode-textarea")
			const dialogCreateButton = screen.getByText("Create Mode", { selector: "vscode-button" })

			if (
				dialogNameInput &&
				dialogSlugInput &&
				dialogRoleTextarea &&
				dialogRulesTextarea &&
				dialogObjectiveTextarea
			) {
				fireEvent.input(dialogNameInput, { target: { value: "My Test Mode" } })
				// Slug should auto-populate, but we can also set it if needed
				// fireEvent.input(dialogSlugInput, { target: { value: "my-test-mode" } });
				fireEvent.input(dialogRoleTextarea, { target: { value: "Test Role Def" } })
				fireEvent.input(dialogRulesTextarea, { target: { value: "Test Rules" } })
				fireEvent.input(dialogObjectiveTextarea, { target: { value: "Test Objective" } })
			} else {
				throw new Error("Could not find all dialog input fields")
			}

			fireEvent.click(dialogCreateButton)

			await waitFor(() => {
				expect(vscode.postMessage).toHaveBeenCalledWith(
					expect.objectContaining({
						type: "updateCustomMode",
						slug: "my-test-mode", // or whatever slug is generated
						modeConfig: expect.objectContaining({
							name: "My Test Mode",
							roleDefinition: "Test Role Def",
							rules: "Test Rules",
							objective: "Test Objective",
							source: "global", // default source
						}),
					}),
				)
			})
		})
	})
})
