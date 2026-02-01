# Prompt to Fix Code View Toggle in Rich Text Editor

## Problem Description
The rich text editor has a code view button (`</>`) in the toolbar, but clicking it doesn't toggle to show the HTML/code view of the content. The editor should allow users to switch between visual (WYSIWYG) mode and code/HTML mode.

## Expected Behavior
When clicking the code view button (`</>`):
1. The editor should toggle to show the raw HTML code
2. Users should be able to edit the HTML directly
3. Clicking again should return to visual mode
4. Content should sync properly between both views

## Implementation Requirements

### 1. Add Code View State Management

**If using Tiptap:**
```typescript
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState } from 'react'

function RichTextEditor() {
  const [showCodeView, setShowCodeView] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>A. Digital Public Infrastructure (DPI) 2.0</p>',
    onUpdate: ({ editor }) => {
      if (!showCodeView) {
        setHtmlContent(editor.getHTML())
      }
    },
  })

  const toggleCodeView = () => {
    if (!showCodeView) {
      // Switching TO code view
      setHtmlContent(editor?.getHTML() || '')
    } else {
      // Switching FROM code view back to visual
      editor?.commands.setContent(htmlContent)
    }
    setShowCodeView(!showCodeView)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(e.target.value)
  }

  return (
    <div className="editor-container">
      {/* Toolbar */}
      <div className="toolbar">
        {/* Other toolbar buttons */}
        <button 
          onClick={toggleCodeView}
          className={`toolbar-btn ${showCodeView ? 'active' : ''}`}
          title="Toggle Code View"
        >
          {'</>'}
        </button>
      </div>

      {/* Editor Content */}
      {showCodeView ? (
        <textarea
          value={htmlContent}
          onChange={handleCodeChange}
          className="code-view"
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  )
}
```

### 2. Add Styling for Code View

**CSS for Code View Textarea:**
```css
.code-view {
  width: 100%;
  min-height: 400px;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
  color: #1f2937;
  resize: vertical;
  tab-size: 2;
}

.code-view:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.toolbar-btn.active {
  background-color: #4f46e5;
  color: white;
}

/* Syntax highlighting (optional enhancement) */
.code-view {
  white-space: pre-wrap;
  word-wrap: break-word;
}
```

### 3. Alternative: Using ProseMirror Directly

**If using ProseMirror:**
```typescript
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Schema, DOMParser, DOMSerializer } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'

class CodeViewToggle {
  constructor(private view: EditorView) {
    this.isCodeView = false
    this.codeTextarea = null
  }

  toggle() {
    if (!this.isCodeView) {
      this.enterCodeView()
    } else {
      this.exitCodeView()
    }
  }

  enterCodeView() {
    // Get current HTML from ProseMirror
    const html = this.getHTML()
    
    // Hide editor
    this.view.dom.style.display = 'none'
    
    // Create and show textarea
    this.codeTextarea = document.createElement('textarea')
    this.codeTextarea.className = 'code-view'
    this.codeTextarea.value = this.formatHTML(html)
    this.view.dom.parentNode.appendChild(this.codeTextarea)
    
    this.isCodeView = true
  }

  exitCodeView() {
    if (!this.codeTextarea) return
    
    // Get HTML from textarea
    const html = this.codeTextarea.value
    
    // Update ProseMirror content
    const parser = DOMParser.fromSchema(schema)
    const doc = parser.parse(this.createDOMFromHTML(html))
    this.view.updateState(
      EditorState.create({ doc, plugins: this.view.state.plugins })
    )
    
    // Show editor, remove textarea
    this.view.dom.style.display = ''
    this.codeTextarea.remove()
    this.codeTextarea = null
    
    this.isCodeView = false
  }

  getHTML(): string {
    const div = document.createElement('div')
    const fragment = DOMSerializer
      .fromSchema(schema)
      .serializeFragment(this.view.state.doc.content)
    div.appendChild(fragment)
    return div.innerHTML
  }

  formatHTML(html: string): string {
    // Simple HTML formatting (can use prettier or js-beautify library)
    return html
      .replace(/></g, '>\n<')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n')
  }

  createDOMFromHTML(html: string): HTMLElement {
    const div = document.createElement('div')
    div.innerHTML = html
    return div
  }
}
```

### 4. Enhanced Solution with Syntax Highlighting

**Using CodeMirror for better code editing experience:**
```bash
npm install @codemirror/lang-html @codemirror/view @codemirror/state
```

```typescript
import { EditorView, basicSetup } from 'codemirror'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'

function RichTextEditor() {
  const [showCodeView, setShowCodeView] = useState(false)
  const codeMirrorRef = useRef<EditorView | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleCodeView = () => {
    if (!showCodeView && containerRef.current) {
      // Create CodeMirror instance
      const htmlContent = editor?.getHTML() || ''
      
      codeMirrorRef.current = new EditorView({
        doc: htmlContent,
        extensions: [
          basicSetup,
          html(),
          oneDark, // Optional dark theme
        ],
        parent: containerRef.current,
      })
    } else if (codeMirrorRef.current) {
      // Get content from CodeMirror and update editor
      const newContent = codeMirrorRef.current.state.doc.toString()
      editor?.commands.setContent(newContent)
      codeMirrorRef.current.destroy()
      codeMirrorRef.current = null
    }
    
    setShowCodeView(!showCodeView)
  }

  return (
    <div>
      <div className="toolbar">
        <button onClick={toggleCodeView}>
          {'</>'}
        </button>
      </div>
      
      {showCodeView ? (
        <div ref={containerRef} className="codemirror-container" />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  )
}
```

### 5. Complete Working Example (React + Tiptap)

**Full implementation:**
```typescript
import React, { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import './Editor.css'

interface EditorProps {
  initialContent?: string
  onChange?: (html: string) => void
}

const RichTextEditor: React.FC<EditorProps> = ({ 
  initialContent = '',
  onChange 
}) => {
  const [isCodeView, setIsCodeView] = useState(false)
  const [codeContent, setCodeContent] = useState('')

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      if (!isCodeView) {
        setCodeContent(html)
      }
      onChange?.(html)
    },
  })

  const toggleCodeView = useCallback(() => {
    if (!editor) return

    if (!isCodeView) {
      // Entering code view - save current HTML
      const currentHTML = editor.getHTML()
      setCodeContent(formatHTML(currentHTML))
    } else {
      // Exiting code view - apply changes back to editor
      try {
        editor.commands.setContent(codeContent)
      } catch (error) {
        console.error('Invalid HTML:', error)
        alert('Invalid HTML code. Please check your syntax.')
        return
      }
    }
    
    setIsCodeView(!isCodeView)
  }, [editor, isCodeView, codeContent])

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCodeContent(e.target.value)
  }

  const formatHTML = (html: string): string => {
    // Basic HTML formatting
    let formatted = html
      .replace(/></g, '>\n<')
      .replace(/\n\s*\n/g, '\n')
    
    const lines = formatted.split('\n')
    let indentLevel = 0
    
    return lines.map(line => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      
      // Decrease indent for closing tags
      if (trimmed.startsWith('</')) {
        indentLevel = Math.max(0, indentLevel - 1)
      }
      
      const indented = '  '.repeat(indentLevel) + trimmed
      
      // Increase indent for opening tags (but not self-closing)
      if (trimmed.startsWith('<') && 
          !trimmed.startsWith('</') && 
          !trimmed.endsWith('/>')) {
        indentLevel++
      }
      
      return indented
    }).join('\n')
  }

  return (
    <div className="editor-wrapper">
      {/* Toolbar */}
      <div className="editor-toolbar">
        {!isCodeView && (
          <>
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={editor?.isActive('bold') ? 'is-active' : ''}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={editor?.isActive('italic') ? 'is-active' : ''}
              title="Italic"
            >
              <em>I</em>
            </button>
            
            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={editor?.isActive('underline') ? 'is-active' : ''}
              title="Underline"
            >
              <u>U</u>
            </button>
            
            <div className="toolbar-divider" />
            
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={editor?.isActive('bulletList') ? 'is-active' : ''}
              title="Bullet List"
            >
              •
            </button>
            
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={editor?.isActive('orderedList') ? 'is-active' : ''}
              title="Numbered List"
            >
              1.
            </button>
            
            <div className="toolbar-divider" />
          </>
        )}
        
        {/* Code View Toggle - Always visible */}
        <button
          onClick={toggleCodeView}
          className={`code-view-btn ${isCodeView ? 'is-active' : ''}`}
          title={isCodeView ? 'Visual Editor' : 'Code View'}
        >
          {'</>'}
        </button>
      </div>

      {/* Editor Content */}
      <div className="editor-content">
        {isCodeView ? (
          <div className="code-view-container">
            <textarea
              value={codeContent}
              onChange={handleCodeChange}
              className="code-view-textarea"
              spellCheck={false}
              placeholder="Enter HTML code..."
            />
            <div className="code-view-footer">
              <span className="word-count">
                {codeContent.length} characters
              </span>
            </div>
          </div>
        ) : (
          <EditorContent editor={editor} className="visual-editor" />
        )}
      </div>
      
      {/* Word count for visual mode */}
      {!isCodeView && (
        <div className="editor-footer">
          <span className="word-count">
            {editor?.storage.characterCount?.characters() || 0} characters
          </span>
        </div>
      )}
    </div>
  )
}

export default RichTextEditor
```

**CSS Styling:**
```css
/* Editor.css */

.editor-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.editor-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.editor-toolbar button {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-toolbar button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.editor-toolbar button.is-active {
  background: #4f46e5;
  color: white;
  border-color: #4338ca;
}

.code-view-btn.is-active {
  background: #dc2626 !important;
  border-color: #b91c1c !important;
}

.toolbar-divider {
  width: 1px;
  background: #d1d5db;
  margin: 0 4px;
}

.editor-content {
  min-height: 300px;
}

.visual-editor {
  padding: 16px;
}

.visual-editor .ProseMirror {
  outline: none;
  min-height: 280px;
}

.visual-editor .ProseMirror p {
  margin: 0 0 12px 0;
}

.code-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.code-view-textarea {
  flex: 1;
  width: 100%;
  min-height: 300px;
  padding: 16px;
  font-family: 'Courier New', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  border: none;
  background: #1e1e1e;
  color: #d4d4d4;
  resize: vertical;
  tab-size: 2;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
}

.code-view-textarea:focus {
  outline: none;
}

/* Syntax-like colors for code view (basic) */
.code-view-textarea::selection {
  background: #264f78;
}

.code-view-footer,
.editor-footer {
  padding: 8px 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  font-size: 12px;
  color: #6b7280;
}

.word-count {
  font-family: monospace;
}

/* Responsive */
@media (max-width: 768px) {
  .editor-toolbar {
    padding: 6px;
  }
  
  .editor-toolbar button {
    min-width: 28px;
    height: 28px;
    padding: 4px 8px;
    font-size: 13px;
  }
}
```

### 6. Testing Checklist

After implementation, verify:
- [ ] Code view button is visible and clickable
- [ ] Clicking once shows HTML code
- [ ] HTML is properly formatted with indentation
- [ ] Clicking again returns to visual mode
- [ ] Changes in code view are reflected in visual mode
- [ ] Visual changes are reflected in code view
- [ ] Invalid HTML shows error message
- [ ] Word/character count updates correctly
- [ ] Works on mobile/tablet screens
- [ ] Keyboard shortcuts still work in visual mode
- [ ] Tab key works properly in code view

### 7. Common Issues & Solutions

**Issue 1: Content not syncing**
```typescript
// Solution: Ensure you're properly updating state
const toggleCodeView = () => {
  if (!isCodeView) {
    setCodeContent(editor.getHTML()) // ← Important!
  } else {
    editor.commands.setContent(codeContent) // ← Important!
  }
  setIsCodeView(!isCodeView)
}
```

**Issue 2: HTML gets escaped**
```typescript
// Wrong: This will show escaped HTML
<div>{htmlContent}</div>

// Right: Use dangerouslySetInnerHTML or editor.setContent()
editor.commands.setContent(htmlContent)
```

**Issue 3: Formatting lost**
```typescript
// Add proper HTML formatting function
const formatHTML = (html: string) => {
  // Use a library like 'html-beautify' or 'prettier'
  return html.replace(/></g, '>\n<')
}
```

### 8. Advanced Features (Optional)

**Add line numbers:**
```css
.code-view-textarea {
  background-image: linear-gradient(
    #2d2d2d 50%, 
    transparent 50%
  );
  background-size: 100% 3.2em;
  line-height: 1.6em;
  padding-left: 50px;
  background-attachment: local;
}
```

**Add HTML validation:**
```typescript
import { parse } from 'node-html-parser'

const validateHTML = (html: string): boolean => {
  try {
    parse(html)
    return true
  } catch (error) {
    return false
  }
}
```

---

## Quick Fix Summary

**Minimum code needed:**
```typescript
const [isCodeView, setIsCodeView] = useState(false)
const [htmlCode, setHtmlCode] = useState('')

const toggleCode = () => {
  if (!isCodeView) {
    setHtmlCode(editor.getHTML())
  } else {
    editor.commands.setContent(htmlCode)
  }
  setIsCodeView(!isCodeView)
}

return (
  <>
    <button onClick={toggleCode}>{'</>'}</button>
    {isCodeView ? (
      <textarea value={htmlCode} onChange={e => setHtmlCode(e.target.value)} />
    ) : (
      <EditorContent editor={editor} />
    )}
  </>
)
```

This should fix your code view toggle functionality!
