import { useEffect, useMemo, useState } from "react";
import CodeBlockEditor, { normalizeCodeLanguage } from "./components/CodeBlockEditor";
import CollapsibleSection from "./components/CollapsibleSection";
import DocsEditor, { docHtmlPreview } from "./components/DocsEditor";
import FolderSection from "./components/FolderSection";

const storageKey = "notecode.notes.v1";
const themeKey = "notecode.theme";

function getInitialTheme() {
  const saved = localStorage.getItem(themeKey);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function createSection(type, content = "") {
  return {
    id: crypto.randomUUID(),
    type,
    content,
  };
}

function createFolderSection(name = "New folder") {
  return {
    id: crypto.randomUUID(),
    type: "folder",
    name,
    files: [],
  };
}

function normalizeSection(section) {
  if (section.type === "folder") {
    return {
      id: section.id ?? crypto.randomUUID(),
      type: "folder",
      name: section.name || "Untitled folder",
      files: Array.isArray(section.files)
        ? section.files.map((file) => ({
            id: file.id ?? crypto.randomUUID(),
            name: file.name || "untitled.txt",
            content: typeof file.content === "string" ? file.content : "",
          }))
        : [],
    };
  }

  if (section.type === "doc") {
    return {
      id: section.id ?? crypto.randomUUID(),
      type: "doc",
      content: typeof section.content === "string" ? section.content : "",
    };
  }

  const isCode = section.type === "code";
  return {
    id: section.id ?? crypto.randomUUID(),
    type: isCode ? "code" : "label",
    content: typeof section.content === "string" ? section.content : "",
    ...(isCode ? { language: normalizeCodeLanguage(section.language) } : {}),
  };
}

const starterNotes = [
  {
    id: crypto.randomUUID(),
    title: "Redirect Thank You Page",
    sections: [
      createSection("label", "REDIRECT THANK YOU PAGE"),
      createSection(
        "code",
        "<script>window.top.location.href='https://www.poleaantvinehc.com/home-care-thank-you';</script>"
      ),
      createSection(
        "label",
        "Note: if naay scroll bar sa form, check JS plugins first."
      ),
      createSection(
        "code",
        "window.addEventListener('message', (event) => {\n  if (event.data?.type === 'adjustHeight') {\n    const iframe = document.getElementById('myframe');\n    if (iframe) iframe.style.height = `${event.data.height}px`;\n  }\n});"
      ),
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

function createNote() {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New note",
    sections: [createSection("label", "")],
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeNote(note) {
  if (Array.isArray(note.sections)) {
    return {
      ...note,
      sections: note.sections.map(normalizeSection),
    };
  }

  if (Array.isArray(note.blocks)) {
    return {
      ...note,
      sections: note.blocks.map((block) =>
        normalizeSection({
          id: block.id,
          type: block.kind === "code" ? "code" : "label",
          content: block.content,
        })
      ),
      createdAt: note.createdAt ?? Date.now(),
      updatedAt: note.updatedAt ?? Date.now(),
    };
  }

  const type = note.type === "code" ? "code" : "label";
  return {
    id: note.id ?? crypto.randomUUID(),
    title: note.title ?? "Untitled",
    sections: [createSection(type, typeof note.content === "string" ? note.content : "")],
    createdAt: note.createdAt ?? Date.now(),
    updatedAt: note.updatedAt ?? Date.now(),
  };
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [notes, setNotes] = useState(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return starterNotes;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length
        ? parsed.map(normalizeNote)
        : starterNotes;
    } catch {
      return starterNotes;
    }
  });
  const [activeId, setActiveId] = useState(notes[0]?.id ?? null);
  const [copiedBlockId, setCopiedBlockId] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [collapsedSectionIds, setCollapsedSectionIds] = useState(() => new Set());

  const toggleSectionCollapsed = (sectionId) => {
    setCollapsedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const sectionPreview = (content) => {
    const line = (content || "").split("\n").find((l) => l.trim()) ?? "";
    if (!line) return "Empty";
    return line.length > 72 ? `${line.slice(0, 72)}…` : line;
  };

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeId) ?? null,
    [notes, activeId]
  );

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const titleA = (a.title || "Untitled").trim().toLowerCase();
      const titleB = (b.title || "Untitled").trim().toLowerCase();
      return titleA.localeCompare(titleB);
    });
  }, [notes]);

  const isDark = theme === "dark";

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(themeKey, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (!activeId && notes.length) {
      setActiveId(notes[0].id);
    }
  }, [activeId, notes]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const updateNote = (id, patch) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note
      )
    );
  };

  const mapSections = (noteId, mapper) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId
          ? { ...note, sections: note.sections.map(mapper), updatedAt: Date.now() }
          : note
      )
    );
  };

  const addNote = () => {
    const note = createNote();
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
  };

  const deleteNote = (noteId) => {
    setNotes((prev) => {
      const next = prev.filter((note) => note.id !== noteId);
      setActiveId((current) => (current === noteId ? (next[0]?.id ?? null) : current));
      return next;
    });
    setPendingDeleteId(null);
  };

  const pendingDeleteNote = useMemo(
    () => notes.find((note) => note.id === pendingDeleteId) ?? null,
    [notes, pendingDeleteId]
  );

  const addSection = (type) => {
    if (!activeNote) return;
    const section =
      type === "folder" ? createFolderSection() : createSection(type, "");
    updateNote(activeNote.id, {
      sections: [...activeNote.sections, section],
    });
  };

  const updateSection = (noteId, sectionId, content) => {
    mapSections(noteId, (section) =>
      section.id === sectionId ? { ...section, content } : section
    );
  };

  const patchSection = (noteId, sectionId, patch) => {
    mapSections(noteId, (section) =>
      section.id === sectionId ? { ...section, ...patch } : section
    );
  };

  const deleteSection = (noteId, sectionId) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId
          ? {
              ...note,
              sections: note.sections.filter((section) => section.id !== sectionId),
              updatedAt: Date.now(),
            }
          : note
      )
    );
  };

  const updateFolderName = (noteId, sectionId, name) => {
    mapSections(noteId, (section) =>
      section.id === sectionId && section.type === "folder"
        ? { ...section, name }
        : section
    );
  };

  const addFileToFolder = (noteId, sectionId, file) => {
    mapSections(noteId, (section) =>
      section.id === sectionId && section.type === "folder"
        ? { ...section, files: [...section.files, file] }
        : section
    );
  };

  const importFilesToFolder = (noteId, sectionId, files) => {
    mapSections(noteId, (section) =>
      section.id === sectionId && section.type === "folder"
        ? { ...section, files: [...section.files, ...files] }
        : section
    );
  };

  const updateFolderFile = (noteId, sectionId, fileId, patch) => {
    mapSections(noteId, (section) => {
      if (section.id !== sectionId || section.type !== "folder") return section;
      return {
        ...section,
        files: section.files.map((file) =>
          file.id === fileId ? { ...file, ...patch } : file
        ),
      };
    });
  };

  const removeFolderFile = (noteId, sectionId, fileId) => {
    mapSections(noteId, (section) => {
      if (section.id !== sectionId || section.type !== "folder") return section;
      return {
        ...section,
        files: section.files.filter((file) => file.id !== fileId),
      };
    });
  };

  const copyContent = async (content, id) => {
    await navigator.clipboard.writeText(content);
    setCopiedBlockId(id);
    window.setTimeout(() => setCopiedBlockId(""), 1300);
  };

  const renderSection = (section) => {
    const collapsed = collapsedSectionIds.has(section.id);

    if (section.type === "label") {
      return (
        <CollapsibleSection
          key={section.id}
          label="Text"
          collapsed={collapsed}
          onToggle={() => toggleSectionCollapsed(section.id)}
          preview={sectionPreview(section.content)}
          shellClassName="overflow-hidden rounded-lg border border-stone-300/70 bg-stone-50/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/50"
          headerClassName="flex items-center justify-between gap-2 border-b border-stone-200/80 px-3 py-2 dark:border-slate-700/80"
          headerActions={
            <button
              type="button"
              onClick={() => deleteSection(activeNote.id, section.id)}
              className="shrink-0 rounded-md border border-rose-300/60 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-950/80 dark:focus-visible:ring-rose-500"
            >
              Remove
            </button>
          }
        >
          <textarea
            value={section.content}
            onChange={(e) => updateSection(activeNote.id, section.id, e.target.value)}
            placeholder="Type your label or note text here..."
            rows={Math.max(3, section.content.split("\n").length)}
            className="custom-scrollbar block w-full resize-y border-0 bg-transparent px-4 py-3 text-xs font-normal leading-relaxed text-stone-800 outline-none placeholder:text-stone-400 focus:ring-0 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </CollapsibleSection>
      );
    }

    if (section.type === "doc") {
      return (
        <CollapsibleSection
          key={section.id}
          label="Doc"
          collapsed={collapsed}
          onToggle={() => toggleSectionCollapsed(section.id)}
          preview={docHtmlPreview(section.content)}
          shellClassName="overflow-hidden rounded-lg border border-blue-300/50 bg-white shadow-sm dark:border-blue-900/50 dark:bg-slate-900/50"
          headerClassName="flex items-center justify-between gap-2 border-b border-stone-200/80 px-3 py-2 dark:border-slate-700/80"
          headerActions={
            <button
              type="button"
              onClick={() => deleteSection(activeNote.id, section.id)}
              className="shrink-0 rounded-md border border-rose-300/60 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-950/80 dark:focus-visible:ring-rose-500"
            >
              Remove
            </button>
          }
        >
          <DocsEditor
            value={section.content}
            onChange={(content) => updateSection(activeNote.id, section.id, content)}
          />
        </CollapsibleSection>
      );
    }

    if (section.type === "folder") {
      return (
        <FolderSection
          key={section.id}
          section={section}
          noteId={activeNote.id}
          onRemoveSection={deleteSection}
          onUpdateFolderName={updateFolderName}
          onAddFile={addFileToFolder}
          onImportFiles={importFilesToFolder}
          onUpdateFile={updateFolderFile}
          onRemoveFile={removeFolderFile}
        />
      );
    }

    return (
      <CollapsibleSection
        key={section.id}
        label="Code"
        collapsed={collapsed}
        onToggle={() => toggleSectionCollapsed(section.id)}
        preview={sectionPreview(section.content)}
        shellClassName="overflow-hidden rounded-lg border border-stone-700/30 bg-[#1e1e1e] shadow-lg dark:border-slate-700/50 dark:bg-[#141414]"
        headerClassName="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2"
        headerActions={
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <select
              value={section.language || "javascript"}
              onChange={(e) =>
                patchSection(activeNote.id, section.id, { language: e.target.value })
              }
              title="Syntax highlighting language"
              className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="python">Python</option>
              <option value="bash">Bash</option>
            </select>
            <button
              type="button"
              onClick={() => copyContent(section.content, section.id)}
              className="rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              {copiedBlockId === section.id ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => deleteSection(activeNote.id, section.id)}
              className="rounded-md border border-rose-900/80 bg-rose-950/40 px-2.5 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-950/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
            >
              Remove
            </button>
          </div>
        }
      >
        <CodeBlockEditor
          value={section.content}
          onChange={(content) => updateSection(activeNote.id, section.id, content)}
          language={section.language}
          placeholder="Paste your code here..."
        />
      </CollapsibleSection>
    );
  };

  return (
    <div className="min-h-screen bg-stone-200 text-stone-800 dark:bg-slate-950 dark:text-slate-200">
      <div className="flex h-screen w-full">
        <aside className="flex w-72 shrink-0 flex-col border-r border-stone-300/80 bg-stone-300/40 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="border-b border-stone-300/80 p-4 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h1 className="text-sm font-semibold tracking-wide text-stone-600 dark:text-slate-400">
                NOTES
              </h1>
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="rounded-lg border border-stone-400/60 bg-stone-100/80 px-2.5 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/80 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus-visible:ring-slate-500"
              >
                {isDark ? "☀ Light" : "☾ Dark"}
              </button>
            </div>
            <button
              type="button"
              onClick={addNote}
              className="w-full rounded-lg border border-stone-400/50 bg-stone-100/90 px-3 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-200/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/80 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus-visible:ring-slate-500"
            >
              + New note
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto">
            {sortedNotes.map((note) => {
              const isActive = note.id === activeId;
              return (
                <div
                  key={note.id}
                  className={`group flex w-full items-center border-b border-stone-300/60 dark:border-slate-800 ${
                    isActive
                      ? "bg-stone-100/90 dark:bg-slate-800/80"
                      : "hover:bg-stone-200/50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(note.id)}
                    className="flex min-w-0 flex-1 items-start gap-2 px-4 py-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-400/70 dark:focus-visible:ring-slate-500"
                  >
                    <span className="mt-0.5 text-stone-400 dark:text-slate-500" aria-hidden>
                      ≡
                    </span>
                    <span className="line-clamp-2 text-xs font-medium uppercase tracking-wide text-stone-700 dark:text-slate-300">
                      {note.title || "Untitled"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(note.id)}
                    className="mr-2 shrink-0 rounded px-2 py-1 text-xs font-medium text-rose-600 opacity-0 transition group-hover:opacity-100 hover:bg-rose-100/90 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 dark:text-rose-400 dark:hover:bg-rose-950/60"
                  >
                    Delete tab
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-stone-100/80 dark:bg-slate-950">
          {!activeNote ? (
            <div className="grid h-full place-items-center px-6 py-8 text-center text-stone-500 dark:text-slate-500">
              <div>
                <p className="mb-2 text-lg text-stone-700 dark:text-slate-300">No note selected</p>
                <p className="text-sm">Create a note from the sidebar.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="z-10 shrink-0 border-b border-stone-300/70 bg-stone-100/95 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    value={activeNote.title}
                    onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                    placeholder="Note title"
                    className="min-w-52 flex-1 border-0 bg-transparent text-xl font-semibold uppercase tracking-wide text-stone-800 outline-none placeholder:text-stone-400 focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => addSection("label")}
                    className="rounded-lg border border-stone-400/50 bg-stone-200/60 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/80 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus-visible:ring-slate-500"
                  >
                    + Text
                  </button>
                  <button
                    type="button"
                    onClick={() => addSection("doc")}
                    className="rounded-lg border border-blue-400/60 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    + Doc
                  </button>
                  <button
                    type="button"
                    onClick={() => addSection("code")}
                    className="rounded-lg border border-stone-600 bg-stone-700 px-4 py-2 text-sm font-medium text-stone-100 transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:border-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 dark:focus-visible:ring-slate-400"
                  >
                    + Code block
                  </button>
                  <button
                    type="button"
                    onClick={() => addSection("folder")}
                    className="rounded-lg border border-amber-500/70 bg-amber-600 px-4 py-2 text-sm font-medium text-amber-50 transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-700 dark:bg-amber-800 dark:hover:bg-amber-700"
                  >
                    + Folder
                  </button>
                </div>
              </div>

              <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
                <div className="flex w-full flex-col gap-5">
                  {activeNote.sections.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-stone-300/80 px-4 py-8 text-center text-sm text-stone-500 dark:border-slate-700 dark:text-slate-500">
                      No sections yet. Add <strong>Text</strong>, <strong>Doc</strong>,{" "}
                      <strong>Code</strong>, or a <strong>Folder</strong>.
                    </p>
                  ) : null}
                  {activeNote.sections.map((section) => renderSection(section))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {pendingDeleteNote ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 dark:bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-tab-title"
          onClick={() => setPendingDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-stone-300 bg-stone-100 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-tab-title"
              className="text-base font-semibold text-stone-800 dark:text-slate-100"
            >
              Delete this tab?
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-slate-400">
              “{pendingDeleteNote.title || "Untitled"}” will be removed permanently.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="rounded-lg border border-stone-400/60 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-200/80 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => deleteNote(pendingDeleteNote.id)}
                className="rounded-lg border border-rose-500 bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
