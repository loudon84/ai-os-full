"use client";

import { forwardRef, useEffect, useImperativeHandle } from "react";
import TiptapImage from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

export type EmailTiptapEditorHandle = {
  getHTML: () => string;
  getText: () => string;
  setContent: (html: string) => void;
  focus: () => void;
};

export type EmailTiptapEditorProps = {
  /** 初始 HTML；变化时会 setContent（用于回复/转发预填） */
  initialHtml?: string | null;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export const EmailTiptapEditor = forwardRef<EmailTiptapEditorHandle, EmailTiptapEditorProps>(
  function EmailTiptapEditor(
    { initialHtml = "", placeholder = "在此撰写邮件正文…", className, disabled = false },
    ref,
  ) {
    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
        }),
        TiptapImage.configure({ allowBase64: true }),
        Placeholder.configure({ placeholder }),
      ],
      content: initialHtml ?? "",
      editable: !disabled,
      editorProps: {
        attributes: {
          class:
            "min-h-[200px] max-w-none px-3 py-2 text-sm text-foreground focus:outline-none [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_a]:text-primary [&_a]:underline",
        },
      },
    });

    useEffect(() => {
      if (!editor) return;
      editor.setEditable(!disabled);
    }, [editor, disabled]);

    useEffect(() => {
      if (!editor) return;
      const next = initialHtml ?? "";
      const current = editor.getHTML();
      if (next === current) return;
      editor.commands.setContent(next, { emitUpdate: false });
    }, [editor, initialHtml]);

    useImperativeHandle(
      ref,
      () => ({
        getHTML: () => editor?.getHTML().trim() ?? "",
        getText: () => editor?.getText().trim() ?? "",
        setContent: (html: string) => {
          editor?.commands.setContent(html, { emitUpdate: false });
        },
        focus: () => {
          editor?.commands.focus();
        },
      }),
      [editor],
    );

    if (!editor) {
      return (
        <div className={cn("h-[250px] rounded-md border border-default-200 bg-muted/30", className)}>
          <div className="p-3 text-sm text-muted-foreground">加载编辑器…</div>
        </div>
      );
    }

    return (
      <div className={cn("rounded-md border border-default-200 bg-background", className)}>
        <div className="flex flex-wrap items-center gap-0.5 border-b border-default-200 bg-muted/40 px-1 py-1">
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="加粗"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="斜体"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("underline")}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="下划线"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Toggle>
          <Separator orientation="vertical" className="mx-0.5 h-6" />
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="二级标题"
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Separator orientation="vertical" className="mx-0.5 h-6" />
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="无序列表"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="有序列表"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Separator orientation="vertical" className="mx-0.5 h-6" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => {
              const prev = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("链接地址", prev ?? "https://");
              if (url === null) return;
              if (url === "") {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }}
            aria-label="插入链接"
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => {
              const src = window.prompt("图片 URL（https）");
              if (!src) return;
              editor.chain().focus().setImage({ src }).run();
            }}
            aria-label="插入图片"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-[210px] overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  },
);
