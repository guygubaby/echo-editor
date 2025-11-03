# Comment 扩展使用指南

## 📝 简介

Comment 扩展为 Echo Editor 提供了类似 Google Docs 的评论功能，允许用户对选中的文本添加评论标记。

## ✨ 功能特性

- ✅ 为选中文本添加评论标记
- ✅ 类似 AI 助手的输入框界面
- ✅ 点击工具栏按钮弹出评论输入框
- ✅ 支持自定义评论创建回调，将数据暴露给外部
- ✅ 点击评论高亮文本触发激活回调
- ✅ 美观的黄色高亮效果
- ✅ 深色模式支持
- ✅ 支持多个评论并存

## 📦 使用方法

### 1. 基础使用

```typescript
import { Editor } from '@tiptap/vue-3'
import { Comment } from 'echo-editor'

const editor = new Editor({
  extensions: [
    // ... 其他扩展
    Comment.configure({
      HTMLAttributes: {
        class: 'echo-comment',
      },
      onCommentActivated: (commentId) => {
        console.log('激活的评论 ID:', commentId)
        // 在这里处理评论激活逻辑，如显示评论面板
      },
    }),
  ],
})
```

### 2. 配置选项

```typescript
// 评论数据接口
export interface CommentData {
  commentId: string          // 前端生成的唯一ID
  selectedText: string       // 选中的文字内容
  annotationContent: string  // 批注内容
}

export interface CommentOptions {
  // HTML 属性自定义
  HTMLAttributes: Record<string, any>
  
  // 评论创建回调 - 当用户创建评论时触发，将数据暴露给外部
  onCommentCreate?: (data: CommentData) => void | Promise<void>
  
  // 评论激活回调 - 当用户点击评论时触发
  onCommentActivated?: (commentId: string | null) => void
}
```

### 3. 工作流程

1. **用户选中文本** → 点击工具栏评论按钮
2. **打开输入框** → 浮动在选中文本附近（类似 AI 助手）
3. **输入评论内容** → 点击提交
4. **触发回调** → `onCommentCreate` 将数据暴露给外部
5. **外部处理** → 调用后端 API 保存评论数据
6. **添加标记** → 为选中文本添加黄色高亮标记

### 4. 命令 API

#### setComment(commentId: string)
为选中的文本添加评论标记

```typescript
// 添加评论
const commentId = `comment-${Date.now()}`
editor.chain().focus().setComment(commentId).run()
```

#### unsetComment(commentId: string)
移除指定的评论标记

```typescript
// 移除评论
editor.chain().focus().unsetComment('comment-123').run()
```

#### toggleComment(commentId: string)
切换评论标记状态

```typescript
// 切换评论
editor.commands.toggleComment('comment-123')
```

### 5. 完整示例：基础使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { BaseKit, Comment } from 'echo-editor'
import type { CommentData } from 'echo-editor'
import 'echo-editor/style.css'

// 评论列表
const comments = ref<CommentData[]>([])
const activeCommentId = ref<string | null>(null)

const editor = useEditor({
  extensions: [
    BaseKit.configure({
      placeholder: {
        placeholder: '选中文本并点击评论按钮添加评论...'
      }
    }),
    Comment.configure({
      // 评论创建回调 - 将数据暴露给外部
      onCommentCreate: (data) => {
        console.log('新评论数据:', data)
        
        // 保存到本地状态
        comments.value.push({
          ...data,
          author: '当前用户',
          createdAt: new Date(),
        })
      },
      // 评论激活回调 - 点击评论时触发
      onCommentActivated: (commentId) => {
        activeCommentId.value = commentId
        if (commentId) {
          scrollToComment(commentId)
        }
      },
    }),
  ],
  content: '<p>选中文本并点击工具栏的评论按钮，在弹出的输入框中输入评论内容。</p>',
})

// 删除评论
function deleteComment(commentId: string) {
  if (!editor.value) return
  
  // 移除评论标记
  editor.value.commands.unsetComment(commentId)
  
  // 删除评论数据
  const index = comments.value.findIndex(c => c.commentId === commentId)
  if (index > -1) {
    comments.value.splice(index, 1)
  }
}

// 滚动到评论
function scrollToComment(commentId: string) {
  const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`)
  if (commentElement) {
    commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
</script>

<template>
  <div class="flex gap-4">
    <!-- 编辑器区域 -->
    <div class="flex-1">
      <EditorContent :editor="editor" />
    </div>
    
    <!-- 评论侧边栏 -->
    <div class="w-80 border-l pl-4">
      <h3 class="text-lg font-bold mb-4">评论列表</h3>
      <div v-if="comments.length === 0" class="text-gray-500">
        暂无评论
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="comment in comments"
          :key="comment.commentId"
          class="p-4 border rounded"
          :class="{ 'bg-yellow-50': comment.commentId === activeCommentId }"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-semibold">{{ comment.author }}</span>
            <button
              @click="deleteComment(comment.commentId)"
              class="text-red-500 text-sm"
            >
              删除
            </button>
          </div>
          <div class="text-sm mb-2">{{ comment.annotationContent }}</div>
          <div class="text-xs text-gray-400">
            选中文本: {{ comment.selectedText }}
          </div>
          <div class="text-xs text-gray-500 mt-2">
            {{ comment.createdAt.toLocaleString() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 6. 与后端 API 集成示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { BaseKit, Comment } from 'echo-editor'
import type { CommentData } from 'echo-editor'
import 'echo-editor/style.css'

// 当前章节ID（从路由或props获取）
const chapterId = ref('chapter-123')
// 当前用户ID（从认证状态获取）
const userId = ref('user-456')

const comments = ref<CommentData[]>([])

const editor = useEditor({
  extensions: [
    BaseKit,
    Comment.configure({
      // 评论创建回调 - 调用后端 API
      onCommentCreate: async (data) => {
        try {
          // 调用后端接口
          const response = await fetch('/textannotation/addTextAnnotation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // 添加认证 token
              'hswatersession': localStorage.getItem('accessToken') || '',
            },
            body: JSON.stringify({
              chapter_id: chapterId.value,
              selected_text: data.selectedText,
              annotation_content: data.annotationContent,
              user_id: userId.value,
              create_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
              use_status: '1',
            }),
          })

          const result = await response.json()

          if (result.json_ok) {
            // 保存到本地状态
            comments.value.push({
              ...data,
              author: '当前用户',
              createdAt: new Date(),
            })
            
            console.log('评论保存成功:', result)
          } else {
            console.error('评论保存失败:', result.json_msg)
            // 移除已添加的评论标记
            editor.value?.commands.unsetComment(data.commentId)
          }
        } catch (error) {
          console.error('API 调用失败:', error)
          // 移除已添加的评论标记
          editor.value?.commands.unsetComment(data.commentId)
        }
      },
      onCommentActivated: (commentId) => {
        console.log('激活评论:', commentId)
      },
    }),
  ],
})
</script>

<template>
  <EditorContent :editor="editor" />
</template>
```

## 🎨 样式自定义

Comment 扩展使用 `echo-comment` 类名，默认样式包括：

```css
.echo-comment {
  /* 浅色模式 */
  background-color: rgb(254 249 195); /* yellow-100 */
  
  /* 深色模式 */
  background-color: rgb(113 63 18 / 0.3); /* yellow-900/30 */
  
  /* hover 效果 */
  transition: background-color 0.2s;
}
```

你可以通过配置自定义样式：

```typescript
Comment.configure({
  HTMLAttributes: {
    class: 'my-custom-comment',
  },
})
```

## 📝 存储数据结构

Comment 扩展在文档中的存储格式：

```html
<span data-comment-id="comment-123">这是一段有评论的文本</span>
```

JSON 格式：

```json
{
  "type": "text",
  "text": "这是一段有评论的文本",
  "marks": [
    {
      "type": "comment",
      "attrs": {
        "commentId": "comment-123"
      }
    }
  ]
}
```

## 🔧 高级用法

### API 错误处理

```typescript
Comment.configure({
  onCommentCreate: async (data) => {
    try {
      const response = await fetch('/textannotation/addTextAnnotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'hswatersession': getToken(),
        },
        body: JSON.stringify({
          chapter_id: currentChapterId,
          selected_text: data.selectedText,
          annotation_content: data.annotationContent,
          user_id: currentUserId,
          create_time: formatDateTime(new Date()),
          use_status: '1',
        }),
      })

      const result = await response.json()

      if (!result.json_ok) {
        throw new Error(result.json_msg || '保存失败')
      }

      // 保存成功后的处理
      console.log('评论保存成功')
    } catch (error) {
      // 保存失败，移除已添加的评论标记
      editor.value?.commands.unsetComment(data.commentId)
      
      // 显示错误提示
      alert(`评论保存失败: ${error.message}`)
    }
  }
})

// 工具函数：格式化日期时间
function formatDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

// 工具函数：获取认证 token
function getToken(): string {
  return localStorage.getItem('accessToken') || ''
}
```

### 实时协作

如果你使用 Tiptap Collaboration 进行实时协作，Comment 扩展会自动同步：

```typescript
import { Collaboration } from '@tiptap/extension-collaboration'
import * as Y from 'yjs'

const ydoc = new Y.Doc()

const editor = new Editor({
  extensions: [
    Collaboration.configure({
      document: ydoc,
    }),
    Comment.configure({
      // 评论配置
    }),
  ],
})
```

## 🎯 最佳实践

1. **错误处理**：在 `onCommentCreate` 回调中处理 API 失败情况
   ```typescript
   Comment.configure({
     onCommentCreate: async (data) => {
       try {
         await saveToBackend(data)
       } catch (error) {
         // 保存失败时，移除已添加的评论标记
         editor.value?.commands.unsetComment(data.commentId)
         showErrorMessage(error.message)
       }
     }
   })
   ```

2. **数据持久化**：使用后端 API 保存评论数据
   ```typescript
   // ✅ 推荐：保存到后端
   async function saveToBackend(data: CommentData) {
     await fetch('/textannotation/addTextAnnotation', {
       method: 'POST',
       body: JSON.stringify({
         chapter_id: chapterId,
         selected_text: data.selectedText,
         annotation_content: data.annotationContent,
         user_id: userId,
         create_time: formatDateTime(new Date()),
         use_status: '1',
       })
     })
   }
   
   // ❌ 不推荐：仅保存到 localStorage（数据会丢失）
   localStorage.setItem('comments', JSON.stringify(comments))
   ```

3. **清理孤立评论**：定期清理已删除文本的评论
   ```typescript
   function cleanOrphanedComments() {
     const { doc } = editor.value!.state
     const activeCommentIds = new Set<string>()
     
     doc.descendants((node) => {
       if (node.isText && node.marks) {
         node.marks.forEach(mark => {
           if (mark.type.name === 'comment') {
             activeCommentIds.add(mark.attrs.commentId)
           }
         })
       }
     })
     
     // 删除不在文档中的评论
     comments.value = comments.value.filter(c => activeCommentIds.has(c.commentId))
   }
   ```

4. **用户体验优化**：提供及时反馈
   ```typescript
   Comment.configure({
     onCommentCreate: async (data) => {
       // 显示加载状态
       showLoading('正在保存评论...')
       
       try {
         await saveToBackend(data)
         showSuccess('评论添加成功')
       } catch (error) {
         editor.value?.commands.unsetComment(data.commentId)
         showError('评论保存失败')
       } finally {
         hideLoading()
       }
     }
   })
   ```

## 🐛 常见问题

### Q: 点击评论按钮没有反应？

A: 请确保已选中文本。评论按钮只在选中文本时才会打开输入框：

```typescript
// 检查是否有选中文本
const { from, to } = editor.state.selection
if (from === to) {
  console.log('请先选中文本')
}
```

### Q: 如何获取评论关联的原始文本？

A: 使用 `onCommentCreate` 回调的 `selectedText` 参数：

```typescript
Comment.configure({
  onCommentCreate: (data) => {
    console.log('选中的文本:', data.selectedText)
    console.log('评论内容:', data.annotationContent)
  }
})
```

### Q: 如何高亮当前激活的评论？

A: 使用 `onCommentActivated` 回调设置激活状态：

```typescript
const activeCommentId = ref<string | null>(null)

Comment.configure({
  onCommentActivated: (commentId) => {
    activeCommentId.value = commentId
    
    // 更新 DOM 属性
    document.querySelectorAll('.echo-comment').forEach(el => {
      el.removeAttribute('data-comment-active')
    })
    
    if (commentId) {
      const activeEl = document.querySelector(`[data-comment-id="${commentId}"]`)
      if (activeEl) {
        activeEl.setAttribute('data-comment-active', 'true')
      }
    }
  },
})
```

### Q: 如何支持评论嵌套/回复？

A: Comment 扩展只负责文本标记，评论的嵌套结构由你的数据模型决定：

```typescript
interface CommentData {
  commentId: string
  content: string
  author: string
  parentId?: string // 父评论 ID
  replies: CommentData[] // 子评论
}
```

### Q: API 调用失败后如何回滚？

A: 在 catch 块中移除已添加的评论标记：

```typescript
Comment.configure({
  onCommentCreate: async (data) => {
    try {
      await saveToBackend(data)
    } catch (error) {
      // 回滚：移除评论标记
      editor.value?.commands.unsetComment(data.commentId)
    }
  }
})
```

### Q: 如何导出包含评论的文档？

A: 评论数据以 Mark 形式存储在 JSON 中：

```typescript
const json = editor.getJSON()
// JSON 中会包含 comment mark 信息

// 如果需要纯文本，移除评论标记
editor.commands.unsetAllMarks()
const plainText = editor.getText()
```

## 📚 相关文档

- [Tiptap Marks 文档](https://tiptap.dev/api/marks)
- [Echo Editor 文档](../../README.md)
- [自定义扩展开发](https://tiptap.dev/guide/custom-extensions)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

