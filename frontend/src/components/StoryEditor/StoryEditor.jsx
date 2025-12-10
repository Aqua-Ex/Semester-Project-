import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const StoryEditor = ({ 
  content = '',
  onChange,
  isActive = false,
  placeholder = 'Continue the story...',
  className = ''
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-6',
      },
    },
  })

  // Keep the editor content in sync when the parent resets (e.g., after submit).
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div className={`
      relative
      rounded-card-lg
      bg-soft-charcoal
      border-2
      ${isActive ? 'border-mint-pop shadow-glow-mint' : 'border-transparent'}
      transition-all duration-300
      ${className}
    `}>
      {isActive && (
        <div className="absolute -top-3 left-4 bg-mint-pop text-deep-graphite px-3 py-1 rounded-full text-xs font-header font-bold">
          Your Turn
        </div>
      )}
      <EditorContent editor={editor} />
      <style jsx global>{`
        .ProseMirror {
          color: #D9D9E0;
          font-size: 1.125rem;
          line-height: 1.75;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #6B7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror strong {
          color: #4AF2C3;
          font-weight: 700;
        }
        .ProseMirror em {
          color: #FFD93D;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}

export default StoryEditor
