# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Development Commands

- `pnpm dev`: Start the main development server.
- `pnpm build:lib`: Build the library into the `lib/` directory.
- `pnpm examples`: Build the library and start the examples development server. This is the recommended way to test changes.
- `pnpm examples:dev`: Start the examples development server (requires the library to be built).
- `pnpm type:check`: Run TypeScript type checking.
- `pnpm lint`: Run ESLint to check for code quality issues.
- `pnpm format`: Run Prettier to format the codebase.
- `pnpm git-commit`: Helper for creating conventional commits using Commitizen.

## Architecture Overview

Echo Editor is a rich-text editor for Vue 3 built on top of **Tiptap** (and thus **ProseMirror**) and **shadcn-vue** (using **reka-ui**).

### Core Structure

- `src/components/EchoEditor.vue`: The main entry point for the editor component. It initializes the Tiptap `Editor` instance and manages the layout (Toolbar, Menubars, Bubble Menus, Editor Content).
- `src/extensions/BaseKit.ts`: A foundational extension that bundles standard Tiptap extensions (Paragraph, Text, Bold, etc.) along with custom utility extensions. Most editor instances should include `BaseKit`.
- `src/extensions/`: Contains all editor extensions. Each extension typically follows a pattern:
  - `index.ts`: Extension definition and configuration.
  - `components/`: Vue components for extension-specific UI (e.g., buttons, popovers).
- `src/hooks/`: Custom Vue composition API hooks for managing editor state, theme, hotkeys, etc.
- `src/locales/`: i18n support for the editor UI.

### Key Patterns

- **Conditional UI**: The visibility of toolbar buttons and bubble menus is often controlled by checking if a specific extension is active in the editor instance using the `hasExtension(editor, 'extensionName')` utility.
- **UI Components**: UI primitives are located in `src/components/ui`. These are styled with Tailwind CSS and follow the shadcn-vue pattern.
- **State Management**: Shared editor state (like fullscreen mode or disabled state) is managed via the `useTiptapStore` hook.
- **Theming**: Theme colors and border radii are managed via the `useTheme` hook and applied as CSS variables.

### Working with Extensions

When adding or modifying a feature:

1. Check `src/extensions/` to see if a similar extension exists.
2. Extensions often need to be registered in `src/extensions/index.ts` or bundled into `BaseKit`.
3. If an extension requires UI (like a toolbar button), update `src/components/Toolbar.vue` or the relevant bubble menu in `src/components/menus/`.
