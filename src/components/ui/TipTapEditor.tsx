"use client";

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Heading from '@tiptap/extension-heading';
import { Button } from '@/components/ui/button';
import Link from '@tiptap/extension-link';

interface TipTapEditorProps {
    value: string;
    onChange: (content: string) => void;
    style?: React.CSSProperties;
    editable?: boolean; // Add this prop
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({ value, onChange, style, editable = true }) => {
    const editor = useEditor({
        extensions: [
            Document,
            Paragraph,
            Text,
            Bold,
            Italic,
            BulletList.configure({
                keepMarks: true,
                keepAttributes: false,
            }),
            OrderedList.configure({
                keepMarks: true,
                keepAttributes: false,
            }),
            ListItem,
            Heading.configure({ levels: [1, 2] }),
            Link.configure({
                openOnClick: true,
                autolink: true,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            if (editable) {
                onChange(editor.getHTML());
            }
        },
        editable: editable, // Pass the editable prop to the editor
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-4 bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
            },
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value, false, {
                preserveWhitespace: true,
            });
        }
    }, [value, editor]);

    if (!editor) {
        return <div>Loading editor...</div>;
    }

    return (
        <div className="flex flex-col h-full min-w-full" style={style}>
            {editable && ( // Show toolbar only if editable
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
                            const url = window.prompt('Enter the URL');
                            if (url) {
                                editor.chain().focus().setLink({ href: url }).run();
                            }
                        }}
                    >
                        Link
                    </Button>
                </div>
            )}
            <div className="flex-grow overflow-y-auto h-full mt-4 mb-4 mr-2 rounded-lg dark:border-purple-500 border-2 border-yellow-500">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default TipTapEditor;