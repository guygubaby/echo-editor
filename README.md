# Echo Editor - Forked from Seedsa/echo-editor

A fork of Seedsa/echo-editor (some reason the origin repository not maintenance anymore, so i made this fork to fix some issues or add some features). A modern AI-powered WYSIWYG rich-text editor for Vue, based on [tiptap](https://tiptap.dev) and [shadcn-vue](https://www.shadcn-vue.com/).

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![](https://img.shields.io/npm/v/echo-editor.svg?label=version)](https://www.npmjs.com/package/echo-editor)
[![](https://img.shields.io/npm/dependency-version/echo-editor/peer/vue?color=vue)](https://www.npmjs.com/package/echo-editor)

English | [中文](./README.zh-CN.md)

![App Screenshot](./screenshot/screenshot.png)

## Demo

[Live Demo](https://echo-editor.jzcloud.site/)

## Features

- 🎨 Beautiful UI with [shadcn-vue](https://www.shadcn-vue.com/) components
- ✨ AI-powered writing assistance
- 📝 Markdown support with real-time preview
- 🔤 Rich text formatting (headings, lists, quotes, etc.)
- 📊 Tables and code blocks
- 🎯 Custom font sizes and styles
- 📄 Import from Word documents
- 🌍 I18n support (`en`, `zhHans`)
- 🧩 Extensible architecture - create your own extensions
- 🎭 TypeScript support
- 🎨 Tailwind CSS support

## Installation

```bash
npm install echo-editor
# or
pnpm install echo-editor
# or
yarn add echo-editor
```

## Usage

### Method 1: Global Registration

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import EchoEditor from 'echo-editor'
import 'echo-editor/style.css'

const app = createApp(App)
app.use(EchoEditor)
app.mount('#app')
```

```ts
<script setup>
import { ref } from 'vue'
import { BaseKit } from 'echo-editor'

const content = ref('')
const extensions = [
  BaseKit.configure({
    placeholder: {
      placeholder: 'Start writing...',
    },
  }),
]
</script>

<template>
  <echo-editor :extensions="extensions" v-model="content" />
</template>
```

### Method 2: Direct Usage

```ts
<script setup>
import { EchoEditor, BaseKit } from 'echo-editor'
import 'echo-editor/style.css'

const content = ref('')
const extensions = [
  BaseKit.configure({
    placeholder: {
      placeholder: 'Start writing...',
    },
  }),
]
</script>

<template>
  <echo-editor :extensions="extensions" v-model="content" />
</template>
```

## Development

1. Install [pnpm](https://pnpm.io/installation)
2. Clone the repository
3. Run `pnpm install`
4. Start development server with `pnpm dev`

To test the build version:

```bash
pnpm examples
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related Projects

- [shadcn-vue](https://www.shadcn-vue.com/)
- [tiptap](https://tiptap.dev)
- [iconify](https://icon-sets.iconify.design)

## License

[MIT](https://choosealicense.com/licenses/mit/)
