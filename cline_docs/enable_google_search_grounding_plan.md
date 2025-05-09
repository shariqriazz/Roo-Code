# Implementation Plan: Enable Google Search Grounding for Gemini and Vertex AI

This document outlines the steps to add a feature allowing users to enable or disable Google Search grounding for Gemini models, whether accessed directly via the Gemini API or through Vertex AI, using the existing `@google/genai` SDK.

## 1. Backend Changes

### 1.1. Update Shared Schemas and Types

**File**: [`src/schemas/index.ts`](src/schemas/index.ts:1)

- **Modify `providerSettingsSchema`**:
    - Add a new optional boolean setting: `enableGoogleSearchGrounding: z.boolean().optional(),`
- **Modify `providerSettingsRecord`**:
    - Add: `enableGoogleSearchGrounding: undefined,`

**Action**: After these changes, run `npm run generate-types` to propagate changes to:

- [`src/exports/types.ts`](src/exports/types.ts:1)
- [`src/exports/roo-code.d.ts`](src/exports/roo-code.d.ts:1)

This will make `enableGoogleSearchGrounding` available in `ApiConfiguration` and `ApiHandlerOptions`.

### 1.2. Update `GeminiHandler`

**File**: [`src/api/providers/gemini.ts`](src/api/providers/gemini.ts:1)

- **Modify `createMessage` method**:
    - Access `this.options.enableGoogleSearchGrounding`.
    - In the `params` object for `this.client.models.generateContentStream()`, conditionally add the `tools` property:
    ```typescript
    tools: this.options.enableGoogleSearchGrounding ? [{ googleSearchRetrieval: {} }] : undefined,
    ```
- **Modify `completePrompt` method** (for non-streaming):
  _ Access `this.options.enableGoogleSearchGrounding`.
  _ In the `params` object for `this.client.models.generateContent()`, conditionally add the `tools` property:
  `typescript
      tools: this.options.enableGoogleSearchGrounding ? [{ googleSearchRetrieval: {} }] : undefined,
      `
  **Note**: These changes will automatically apply to `VertexHandler` as it extends `GeminiHandler` and passes options through.

## 2. Frontend Changes

Follow the general guidelines in [`cline_docs/settings.md`](cline_docs/settings.md:1) for adding a new checkbox setting.

### 2.1. Schema and Type Definitions

- Covered by backend changes (Step 1.1). `enableGoogleSearchGrounding` will be part of `ApiConfiguration` used in frontend state.

### 2.2. Message Types

- **Files**: [`src/shared/WebviewMessage.ts`](src/shared/WebviewMessage.ts:1), [`src/shared/ExtensionMessage.ts`](src/shared/ExtensionMessage.ts:1)
- No new top-level message types are needed. The setting will be part of the `ApiConfiguration` object, which is handled by existing messages like `apiConfiguration` and `upsertApiConfiguration`.

### 2.3. React Context

**File**: [`webview-ui/src/context/ExtensionStateContext.tsx`](webview-ui/src/context/ExtensionStateContext.tsx:1)

- The `ApiConfiguration` type within `ExtensionStateContextType` will automatically include `enableGoogleSearchGrounding` after types are regenerated.
- The existing `setApiConfiguration` setter can be used.
- Ensure `enableGoogleSearchGrounding` is initialized in the `apiConfiguration` part of the `useState` call (e.g., to `false`).

### 2.4. UI Components (Settings Checkboxes)

- **File**: [`webview-ui/src/components/settings/providers/Gemini.tsx`](webview-ui/src/components/settings/providers/Gemini.tsx:1)

    - Import `VSCodeCheckbox` (or your standard checkbox component).
    - Add a new `VSCodeCheckbox` section:

    ```tsx
    <div>
    	<VSCodeCheckbox
    		checked={apiConfiguration?.enableGoogleSearchGrounding ?? false}
    		onChange={(e: any) => {
    			setApiConfigurationField("enableGoogleSearchGrounding", e.target.checked)
    		}}>
    		Enable Google Search Grounding
    	</VSCodeCheckbox>
    	<div className="text-sm text-vscode-descriptionForeground mt-1">
    		Allows the model to use Google Search to ground its responses. (Preview feature)
    	</div>
    </div>
    ```

- **File**: [`webview-ui/src/components/settings/providers/Vertex.tsx`](webview-ui/src/components/settings/providers/Vertex.tsx:1)
    - Import `VSCodeCheckbox`.
    - Add a similar `VSCodeCheckbox` section:
    ```tsx
    <div>
    	<VSCodeCheckbox
    		checked={apiConfiguration?.enableGoogleSearchGrounding ?? false}
    		onChange={(e: any) => {
    			setApiConfigurationField("enableGoogleSearchGrounding", e.target.checked)
    		}}>
    		Enable Google Search Grounding for Gemini Models
    	</VSCodeCheckbox>
    	<div className="text-sm text-vscode-descriptionForeground mt-1">
    		Allows Gemini models used via Vertex AI to use Google Search for grounding. (Preview feature)
    	</div>
    </div>
    ```

### 2.5. Settings View Logic

**File**: [`webview-ui/src/components/settings/SettingsView.tsx`](webview-ui/src/components/settings/SettingsView.tsx:1)

- The `apiConfiguration` object within `cachedState` will now include `enableGoogleSearchGrounding`.
- The `handleSubmit` function already sends the entire `apiConfiguration` object via `vscode.postMessage({ type: "upsertApiConfiguration", ..., apiConfiguration })`. No specific changes are needed here for this new flag, as it will be part of the `apiConfiguration` object being sent.

### 2.6. Core Logic (Extension Side)

- **File**: [`src/core/webview/ClineProvider.ts`](src/core/webview/ClineProvider.ts:1)
    - When `apiConfiguration` is retrieved via `getState()` or updated via `updateApiConfiguration()`, it will include the `enableGoogleSearchGrounding` flag.
    - This flag will be passed to `buildApiHandler` and subsequently to the `GeminiHandler` options, where it will be used as described in step 1.2.
- **File**: [`src/core/webview/webviewMessageHandler.ts`](src/core/webview/webviewMessageHandler.ts:1)
    - The existing `case "apiConfiguration":` and `case "upsertApiConfiguration":` will handle the `ApiConfiguration` object containing the new setting. No specific changes are needed in the message handler for this flag.

## 3. Testing

- **File**: [`src/core/webview/__tests__/ClineProvider.test.ts`](src/core/webview/__tests__/ClineProvider.test.ts:1)
    - Update mock state in tests to include `enableGoogleSearchGrounding` (e.g., in `mockState` or when mocking `provider.getState()`).
    - Add test cases to verify that the `tools` parameter with `googleSearchRetrieval` is correctly added to API calls when `enableGoogleSearchGrounding` is true, and omitted when false.
    - Test the settings persistence: ensure the checkbox state in the UI correctly updates the backend setting and that this setting is correctly loaded.
- Manual testing:
    - Verify the checkboxes appear in the Gemini and Vertex provider settings.
    - Verify toggling the checkbox enables/disables the grounding feature for API calls.
    - Check if responses are grounded (e.g., by looking for citations or more up-to-date information) when the feature is enabled.

## 4. Documentation (Optional)

- Update any relevant user documentation or in-app help text to explain the new Google Search grounding feature and its (Preview) status.
