"use client";

import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Link2Off,
  Undo2,
  Redo2,
} from "lucide-react";

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`rounded p-1.5 transition-colors disabled:opacity-30 ${
              active ? "bg-cyan-300/12 text-cyan-100" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const toggleLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Alamat tautan (URL):", "https://");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
          <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 bg-white/[0.03] px-2 py-1.5">
      <ToolbarButton label="Tebal" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton label="Miring" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton label="Coret" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={15} />
      </ToolbarButton>

            <span className="mx-1 h-5 w-px bg-white/10" />

      <ToolbarButton
        label="Judul 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="Judul 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={15} />
      </ToolbarButton>

            <span className="mx-1 h-5 w-px bg-white/10" />

      <ToolbarButton label="Daftar butir" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton label="Daftar nomor" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton label="Kutipan" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={15} />
      </ToolbarButton>

            <span className="mx-1 h-5 w-px bg-white/10" />

      <ToolbarButton label={editor.isActive("link") ? "Hapus tautan" : "Sisipkan tautan"} active={editor.isActive("link")} onClick={toggleLink}>
        {editor.isActive("link") ? <Link2Off size={15} /> : <Link2 size={15} />}
      </ToolbarButton>

            <span className="mx-1 h-5 w-px bg-white/10" />

      <ToolbarButton label="Urungkan" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 size={15} />
      </ToolbarButton>
      <ToolbarButton label="Ulangi" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 size={15} />
      </ToolbarButton>
    </div>
  );
}

/**
 * Editor teks kaya untuk isi konten. Hasilnya HTML, disimpan pada input
 * tersembunyi supaya form induk tetap membacanya lewat `name` seperti biasa.
 */
export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "Tulis isi konten di sini...",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: defaultValue,
    // Editor tidak dirender di server — hindari ketidakcocokan hidrasi.
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "rte-content" },
    },
    onUpdate: ({ editor: instance }) => setHtml(instance.getHTML()),
  });

  return (
    <div>
      {/* Nilai kosong TipTap tetap "<p></p>"; normalkan agar validasi wajib-isi bekerja. */}
      <input type="hidden" name={name} value={html === "<p></p>" ? "" : html} />
          <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.03] focus-within:border-cyan-300/30 focus-within:ring-2 focus-within:ring-cyan-300/10">
        {editor && <Toolbar editor={editor} />}
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
              <div className="min-h-[220px] px-3 py-2.5 text-sm text-slate-500">{placeholder}</div>
        )}
      </div>
    </div>
  );
}
