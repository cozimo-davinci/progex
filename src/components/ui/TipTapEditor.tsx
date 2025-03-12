"use client";

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Link } from '@tiptap/extension-link';

interface TipTapEditorProps {
    value: string;
    onChange: (content: string) => void;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({ value, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Customize starter kit if needed
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
        ],
        content: value, // Initialize with the passed value
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML()); // Update parent state with HTML content
        },
        editable: true,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-4 min-h-[300px] bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
            },
        },
    });

    if (!editor) {
        return <div>Loading editor...</div>;
    }

    return (
        <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-t-md">
                <Button
                    variant={editor.isActive('bold') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    Bold
                </Button>
                <Button
                    variant={editor.isActive('italic') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    Italic
                </Button>
                <Button
                    variant={editor.isActive('bulletList') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    Bullet List
                </Button>
                <Button
                    variant={editor.isActive('orderedList') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    Ordered List
                </Button>
                <Button
                    variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                    H1
                </Button>
                <Button
                    variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    H2
                </Button>
                <Button
                    variant={editor.isActive('link') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                        const url = window.prompt('Enter URL');
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                        }
                    }}
                >
                    Link
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().unsetLink().run()}
                    disabled={!editor.isActive('link')}
                >
                    Unlink
                </Button>
            </div>
            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
};

export default TipTapEditor;