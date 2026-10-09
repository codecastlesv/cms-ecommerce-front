'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const [, forceRender] = useState(0);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [3] } }),
            Underline,
            Link.configure({ openOnClick: false, autolink: true }),
            Placeholder.configure({ placeholder: placeholder || 'Escribe el contenido…' }),
        ],
        content: value || '',
        immediatelyRender: false,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        onSelectionUpdate: () => forceRender((n) => n + 1),
        onTransaction: () => forceRender((n) => n + 1),
    });

    // Sincroniza cuando el padre resetea el valor (ej. al cambiar de página en el editor)
    useEffect(() => {
        if (!editor) return;
        if (value !== editor.getHTML() && !editor.isFocused) {
            editor.commands.setContent(value || '', false);
        }
    }, [value, editor]);

    if (!editor) return null;

    const setBlock = (type: 'paragraph' | 'h3') => {
        if (type === 'paragraph') editor.chain().focus().setParagraph().run();
        else editor.chain().focus().toggleHeading({ level: 3 }).run();
    };

    const toggleLink = () => {
        const prevUrl = (editor.getAttributes('link').href as string | undefined) || '';
        const url = window.prompt('URL del enlace', prevUrl || 'https://');
        if (url === null) return;
        if (url.trim() === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    };

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-1.5">
                <select
                    value={editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'}
                    onChange={(e) => setBlock(e.target.value === 'h3' ? 'h3' : 'paragraph')}
                    className="rounded-lg border-none bg-transparent px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-200/60"
                >
                    <option value="p">Párrafo</option>
                    <option value="h3">Encabezado de sección</option>
                </select>
                <div className="mx-1 h-5 w-px bg-slate-200" />
                <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="Negrita">
                    <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="Cursiva">
                    <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} label="Subrayado">
                    <UnderlineIcon className="h-3.5 w-3.5" />
                </ToolbarButton>
                <div className="mx-1 h-5 w-px bg-slate-200" />
                <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Lista">
                    <List className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Lista numerada">
                    <ListOrdered className="h-3.5 w-3.5" />
                </ToolbarButton>
                <div className="mx-1 h-5 w-px bg-slate-200" />
                <ToolbarButton active={editor.isActive('link')} onClick={toggleLink} label="Enlace">
                    <LinkIcon className="h-3.5 w-3.5" />
                </ToolbarButton>
            </div>

            <EditorContent editor={editor} className="rte-content px-4 py-3" />

            <style jsx global>{`
                .rte-content .ProseMirror {
                    min-height: 220px;
                    outline: none;
                    font-size: 13.5px;
                    line-height: 1.7;
                    color: #1e293b;
                }
                .rte-content .ProseMirror h3 {
                    font-size: 15px;
                    font-weight: 800;
                    margin: 14px 0 8px;
                    color: #08204e;
                }
                .rte-content .ProseMirror h3:first-child {
                    margin-top: 0;
                }
                .rte-content .ProseMirror p {
                    margin: 0 0 10px;
                }
                .rte-content .ProseMirror ul,
                .rte-content .ProseMirror ol {
                    margin: 0 0 10px;
                    padding-left: 20px;
                }
                .rte-content .ProseMirror a {
                    color: #304c94;
                    text-decoration: underline;
                }
                .rte-content .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}

function ToolbarButton({
    active,
    onClick,
    label,
    children,
}: {
    active?: boolean;
    onClick: () => void;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                active ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
        >
            {children}
        </button>
    );
}
