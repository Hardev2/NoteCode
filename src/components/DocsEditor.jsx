import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import "../styles/docs-editor.css";

const TEXT_COLORS = [
  { label: "Default", value: null },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#2563eb" },
  { label: "Green", value: "#16a34a" },
];

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Clear", value: null },
];

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`docs-toolbar-btn ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="docs-toolbar-divider" aria-hidden />;
}

function DocsToolbar({ editor }) {
  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const applyTextColor = (color) => {
    if (!color) editor.chain().focus().unsetColor().run();
    else editor.chain().focus().setColor(color).run();
  };

  const applyHighlight = (color) => {
    if (!color) editor.chain().focus().unsetHighlight().run();
    else editor.chain().focus().setHighlight({ color }).run();
  };

  return (
    <div className="docs-toolbar flex flex-wrap items-center gap-0.5 border-b border-stone-200/80 bg-stone-200/50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/80">
      <select
        data-docs-toolbar-control
        title="Heading style"
        className="docs-toolbar-btn h-7 min-w-[4.5rem] cursor-pointer border-0 bg-transparent text-xs font-medium outline-none"
        value={
          editor.isActive("heading", { level: 1 })
            ? "h1"
            : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
                ? "h3"
                : "p"
        }
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(v.slice(1)) }).run();
        }}
      >
        <option value="p">Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <ToolbarDivider />

      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <span className="line-through">S</span>
      </ToolbarButton>

      <ToolbarDivider />

      <span className="docs-toolbar-group" title="Text color">
        {TEXT_COLORS.map((swatch) => (
          <button
            key={swatch.label}
            type="button"
            data-docs-toolbar-control
            title={swatch.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyTextColor(swatch.value)}
            className={`docs-color-swatch ${!swatch.value ? "docs-color-swatch--default" : ""}`}
            style={swatch.value ? { backgroundColor: swatch.value } : undefined}
          />
        ))}
      </span>

      <span className="docs-toolbar-group" title="Highlight">
        {HIGHLIGHT_COLORS.map((swatch) => (
          <button
            key={swatch.label}
            type="button"
            data-docs-toolbar-control
            title={swatch.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyHighlight(swatch.value)}
            className={`docs-color-swatch ${!swatch.value ? "docs-color-swatch--clear" : ""}`}
            style={swatch.value ? { backgroundColor: swatch.value } : undefined}
          />
        ))}
      </span>

      <ToolbarDivider />

      <ToolbarButton title="Insert link" active={editor.isActive("link")} onClick={setLink}>
        🔗
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Align left"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        ⬅
      </ToolbarButton>
      <ToolbarButton
        title="Align center"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        ↔
      </ToolbarButton>
      <ToolbarButton
        title="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        ➡
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •≡
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        title="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        “
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Clear formatting"
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().unsetColor().unsetHighlight().run()
        }
      >
        T̸
      </ToolbarButton>
    </div>
  );
}

export function docHtmlPreview(html) {
  const text = (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "Empty";
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

export default function DocsEditor({ value, onChange, placeholder = "Start writing…" }) {
  const lastEmittedHtml = useRef(value ?? "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmittedHtml.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "docs-editor-content",
        spellcheck: "true",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const html = value ?? "";
    if (html === lastEmittedHtml.current) return;
    if (editor.isFocused) return;
    editor.commands.setContent(html, { emitUpdate: false });
    lastEmittedHtml.current = html;
  }, [value, editor]);

  return (
    <div className="docs-editor">
      <DocsToolbar editor={editor} />
      <div className="docs-editor-body">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
