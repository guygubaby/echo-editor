# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Echo Editor is a Vue 3 component library that provides a modern WYSIWYG rich-text editor built on top of Tiptap and shadcn-vue. It's published as an npm package (`@bryce-loskie/echo-editor`) and is a fork of LeeAt67/echo-editor.

## Development Commands

### Core Development
- `pnpm dev` - Start Vite development server for the main library
- `pnpm build:lib` - Build the library for distribution (outputs to `lib/`)
- `pnpm type:check` - Run TypeScript type checking without emitting files

### Examples & Testing
- `pnpm examples` - Build library and run examples app (use this to test the built version)
- `pnpm examples:dev` - Run examples app only (without rebuilding library)
- `pnpm build:examples` - Build both library and examples for production

### Code Quality
- `pnpm lint` - Lint source files in `src/`
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Format all files with Prettier
- `pnpm format:check` - Check formatting without modifying files

### Publishing
- `pnpm push` - Build library and publish to npm (requires proper credentials)

## Architecture

### Build System

The project uses Vite with a custom CSS namespacing plugin:
- All CSS is automatically prefixed with `.echo-editor` class to prevent style conflicts
- Library builds to `lib/` directory with multiple formats (ESM, UMD, types)
- CSS is bundled as a single `style.css` file
- Vue is externalized as a peer dependency

### Core Structure

**Main Entry Point**: `src/index.ts`
- Exports the Vue plugin, components, extensions, types, and utilities
- Provides both plugin-based (`app.use(EchoEditor)`) and direct import usage

**Main Component**: `src/components/EchoEditor.vue`
- The primary editor component that consumers interact with
- Accepts `extensions` prop to configure editor functionality
- Emits change events with editor instance and output content

**Extensions System**: `src/extensions/`
- Contains 50+ Tiptap extensions organized by feature
- Each extension is in its own directory with component and logic files
- `BaseKit.ts` - Core extension bundle that includes essential functionality (Document, Text, Paragraph, Placeholder, Focus, etc.)
- Extensions are modular and can be individually configured or disabled

### Key Directories

- `src/components/` - Vue components including the main EchoEditor, toolbar, menus, and UI elements
- `src/components/menus/` - Bubble menus and context menus (LinkBubbleMenu, TableBubbleMenu, ImageBubbleMenu, etc.)
- `src/extensions/` - Tiptap extensions (AI, Bold, Italic, Table, Image, Video, CodeBlock, etc.)
- `src/hooks/` - Vue composables (useTheme, etc.)
- `src/utils/` - Utility functions
- `src/locales/` - i18n support (en, zhHans)
- `src/styles/` - Global styles and Tailwind CSS
- `examples/` - Standalone example app for testing the built library

### Extension Pattern

Extensions follow a consistent pattern:
1. Each extension directory contains the Tiptap extension definition
2. May include Vue components for UI (buttons, menus, dialogs)
3. Extensions are configured via `BaseKit.configure()` or added individually to the `extensions` array
4. Extensions can be disabled by setting their option to `false` in BaseKit

### Styling

- Uses Tailwind CSS with custom configuration
- Styles are scoped with `.echo-editor` prefix via PostCSS plugin
- shadcn-vue components provide the UI foundation
- Theme system supports light/dark modes via `useTheme` composable

### Type System

- `src/type.ts` - Central type definitions for the editor
- Exports TypeScript types for extensions, editor props, events, and options
- Uses Tiptap's core types as foundation

## Important Patterns

### Adding New Extensions

When creating a new extension:
1. Create directory in `src/extensions/[ExtensionName]/`
2. Define the Tiptap extension (usually `[ExtensionName].ts`)
3. Create UI components if needed (buttons, menus)
4. Export from `src/extensions/index.ts`
5. Optionally add to BaseKit if it should be included by default

### Working with the Examples App

The `examples/` directory is a separate Vite app that imports the built library:
- Has its own `package.json` and dependencies
- Uses the compiled library from `lib/` directory
- Run `pnpm examples` to test changes (rebuilds library first)
- Use `pnpm examples:dev` for faster iteration if library hasn't changed

### CSS Namespacing

All styles are automatically prefixed with `.echo-editor` to avoid conflicts when the library is used in other projects. The custom Vite plugin handles this during build. Selectors starting with `.echo-editor` or `.EchoContentView` are not double-prefixed.

## Technology Stack

- **Vue 3** - Component framework
- **Tiptap 2** - Rich text editor framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS
- **shadcn-vue** (reka-ui) - UI component library
- **VueUse** - Vue composition utilities
- **pnpm** - Package manager (required)

## Node Version

Requires Node.js >= 18.0.0
