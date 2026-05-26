import { useRef, useState } from "react";
import {
  downloadFolderZip,
  exportFolderToDisk,
  formatFileSize,
  getFileExtension,
  readDroppedFiles,
  readFilesFromInput,
  supportsFolderExport,
} from "../utils/fileHelpers";

function createEmptyFile() {
  return {
    id: crypto.randomUUID(),
    name: "untitled.txt",
    content: "",
  };
}

function FileIcon({ name }) {
  const ext = getFileExtension(name);
  return (
    <span className="w-8 shrink-0 text-center text-[10px] font-bold uppercase text-stone-500 dark:text-slate-400">
      {ext.slice(0, 4)}
    </span>
  );
}

export default function FolderSection({
  section,
  noteId,
  onRemoveSection,
  onUpdateFolderName,
  onAddFile,
  onImportFiles,
  onUpdateFile,
  onRemoveFile,
}) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [expandedId, setExpandedId] = useState(null);
  const [dropActive, setDropActive] = useState(false);

  const canExportFolder = supportsFolderExport();
  const fileCount = section.files.length;

  const handleImport = async (event) => {
    const imported = await readFilesFromInput(event.target.files);
    if (imported.length) onImportFiles(noteId, section.id, imported);
    event.target.value = "";
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDropActive(false);
    try {
      const imported = await readDroppedFiles(event.dataTransfer);
      if (imported.length) onImportFiles(noteId, section.id, imported);
    } catch {
      /* ignore */
    }
  };

  const handleExportFolder = async () => {
    if (!fileCount) return;
    try {
      if (canExportFolder) {
        await exportFolderToDisk(section.files, section.name);
      } else {
        downloadFolderZip(section.name, section.files);
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      downloadFolderZip(section.name, section.files);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-stone-300/80 bg-stone-100/50 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-300/60 px-3 py-2 dark:border-slate-700">
        <span className="text-base" aria-hidden>
          📁
        </span>
        <input
          value={section.name}
          onChange={(e) => onUpdateFolderName(noteId, section.id, e.target.value)}
          placeholder="Folder name"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-stone-800 outline-none dark:text-slate-200"
        />
        <button
          type="button"
          onClick={handleExportFolder}
          disabled={!fileCount}
          title={canExportFolder ? "Save files to a folder on your PC" : "Download as ZIP"}
          className="rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100/80 disabled:opacity-40 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
        >
          Export
        </button>
        <button
          type="button"
          onClick={() => onAddFile(noteId, section.id, createEmptyFile())}
          title="New file"
          className="rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200/80 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Add files"
          className="rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200/80 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => folderInputRef.current?.click()}
          title="Import folder"
          className="rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200/80 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Import
        </button>
        <button
          type="button"
          onClick={() => onRemoveSection(noteId, section.id)}
          title="Remove folder"
          className="rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100/80 dark:text-rose-400 dark:hover:bg-rose-950/50"
        >
          ×
        </button>
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleImport} />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        {...{ webkitdirectory: "", directory: "" }}
        onChange={handleImport}
      />

      <div
        className={`min-h-[3rem] ${dropActive ? "bg-emerald-100/40 dark:bg-emerald-950/20" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDropActive(true);
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={handleDrop}
      >
        {fileCount === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-stone-400 dark:text-slate-500">
            No files
          </p>
        ) : (
          <ul>
            {section.files.map((file) => {
              const isOpen = expandedId === file.id;
              const displayName = file.name.includes("/")
                ? file.name.split("/").pop()
                : file.name;

              return (
                <li
                  key={file.id}
                  className="border-b border-stone-200/60 last:border-b-0 dark:border-slate-800"
                >
                  <div className="group flex items-center gap-2 px-3 py-2 hover:bg-stone-200/40 dark:hover:bg-slate-800/50">
                    <FileIcon name={file.name} />
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : file.id)}
                      className="min-w-0 flex-1 truncate text-left text-sm text-stone-800 dark:text-slate-200"
                      title={file.name}
                    >
                      {displayName}
                    </button>
                    <span className="shrink-0 text-xs text-stone-400 dark:text-slate-500">
                      {formatFileSize(file.content)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveFile(noteId, section.id, file.id)}
                      className="shrink-0 rounded px-1.5 py-0.5 text-xs text-stone-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                      title="Delete file"
                    >
                      ×
                    </button>
                  </div>

                  {isOpen ? (
                    <div className="border-t border-stone-200/60 bg-white/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
                      <input
                        value={file.name}
                        onChange={(e) =>
                          onUpdateFile(noteId, section.id, file.id, { name: e.target.value })
                        }
                        className="mb-2 w-full rounded border border-stone-300/60 bg-transparent px-2 py-1 text-xs text-stone-700 outline-none focus:border-stone-400 dark:border-slate-600 dark:text-slate-300"
                        placeholder="filename.css"
                      />
                      <textarea
                        value={file.content}
                        onChange={(e) =>
                          onUpdateFile(noteId, section.id, file.id, { content: e.target.value })
                        }
                        spellCheck={false}
                        rows={Math.max(8, file.content.split("\n").length)}
                        className="custom-scrollbar block w-full resize-y rounded border border-stone-300/60 bg-stone-50 px-2 py-2 font-mono text-xs leading-5 text-stone-800 outline-none focus:border-stone-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
