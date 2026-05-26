import { zipSync } from "fflate";

const MIME_BY_EXT = {
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  jsx: "text/javascript",
  ts: "text/typescript",
  tsx: "text/typescript",
  html: "text/html",
  htm: "text/html",
  php: "application/x-php",
  json: "application/json",
  xml: "application/xml",
  svg: "image/svg+xml",
  txt: "text/plain",
  md: "text/markdown",
  sql: "application/sql",
  py: "text/x-python",
  sh: "application/x-sh",
};

export function supportsFolderExport() {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export function supportsSaveFilePicker() {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

export function getMimeType(filename) {
  const base = filename.includes("/") ? filename.split("/").pop() : filename;
  const ext = base.includes(".") ? base.split(".").pop().toLowerCase() : "";
  return MIME_BY_EXT[ext] || "text/plain";
}

export function getFileExtension(filename) {
  const base = filename.includes("/") ? filename.split("/").pop() : filename;
  const parts = base.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "file";
}

export function formatFileSize(content) {
  const bytes = new TextEncoder().encode(content ?? "").length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"|?*\\]/g, "_").replace(/\//g, "_") || "file";
}

function normalizePath(path) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function downloadFile(name, content) {
  const blob = new Blob([content ?? ""], { type: getMimeType(name) });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = sanitizeFilename(name.includes("/") ? name.split("/").pop() : name);
  link.click();
  URL.revokeObjectURL(url);
}

function createNativeFile(name, content) {
  const safeName = sanitizeFilename(name.includes("/") ? name.split("/").pop() : name);
  return new File([content ?? ""], safeName, {
    type: getMimeType(name),
    lastModified: Date.now(),
  });
}

/** Use native event — required for reliable OS drag in React. */
export function setupFileDragNative(nativeEvent, name, content) {
  const dt = nativeEvent.dataTransfer;
  if (!dt) return;

  nativeEvent.stopPropagation();
  dt.effectAllowed = "copy";
  dt.dropEffect = "copy";

  const file = createNativeFile(name, content);

  if (dt.items?.add) {
    dt.items.clear();
    dt.items.add(file);
  } else if (dt.setData) {
    dt.setData("text/plain", content ?? "");
  }
}

export function setupMultiFileDragNative(nativeEvent, files) {
  const dt = nativeEvent.dataTransfer;
  if (!dt) return;

  nativeEvent.stopPropagation();
  dt.effectAllowed = "copy";
  dt.dropEffect = "copy";

  if (dt.items?.add) {
    dt.items.clear();
    for (const file of files) {
      dt.items.add(createNativeFile(file.name, file.content));
    }
  }
}

async function writeFileInDirectory(dirHandle, relativePath, content) {
  const parts = normalizePath(relativePath).split("/").filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) return;

  let current = dirHandle;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }

  const fileHandle = await current.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content ?? "");
  await writable.close();
}

/** Pick a real folder on your PC and write all files into it (Chrome / Edge). */
export async function exportFolderToDisk(files, folderLabel = "export") {
  if (!supportsFolderExport()) {
    throw new Error("UNSUPPORTED");
  }

  const dirHandle = await window.showDirectoryPicker({
    mode: "readwrite",
    startIn: "downloads",
  });

  for (const file of files) {
    await writeFileInDirectory(dirHandle, file.name, file.content);
  }

  return { count: files.length, folder: folderLabel };
}

/** Save one file to a location the user picks. */
export async function exportSingleFileToDisk(name, content) {
  const baseName = sanitizeFilename(name.includes("/") ? name.split("/").pop() : name);

  if (supportsSaveFilePicker()) {
    const handle = await window.showSaveFilePicker({
      suggestedName: baseName,
    });
    const writable = await handle.createWritable();
    await writable.write(content ?? "");
    await writable.close();
    return true;
  }

  downloadFile(name, content);
  return false;
}

/** ZIP download — works in all browsers; unzip then use in FileZilla. */
export function downloadFolderZip(folderName, files) {
  const entries = {};
  for (const file of files) {
    const path = normalizePath(file.name) || "untitled.txt";
    entries[path] = new TextEncoder().encode(file.content ?? "");
  }

  const zipped = zipSync(entries);
  const blob = new Blob([zipped], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(folderName || "folder")}.zip`;
  link.click();
  URL.revokeObjectURL(url);
}

export function readFilesFromInput(fileList) {
  const files = Array.from(fileList ?? []);
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: crypto.randomUUID(),
              name: file.webkitRelativePath || file.name,
              content: typeof reader.result === "string" ? reader.result : "",
            });
          reader.onerror = () =>
            resolve({
              id: crypto.randomUUID(),
              name: file.webkitRelativePath || file.name,
              content: "",
            });
          reader.readAsText(file);
        })
    )
  );
}

export async function readDroppedFiles(dataTransfer) {
  const items = Array.from(dataTransfer?.items ?? []);
  const fromList = await readFilesFromInput(dataTransfer?.files);
  if (fromList.length) return fromList;

  const collected = [];
  for (const item of items) {
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry) {
      await walkEntry(entry, "", collected);
    }
  }
  return collected;
}

async function walkEntry(entry, path, collected) {
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
    const content = await file.text();
    collected.push({
      id: crypto.randomUUID(),
      name: path ? `${path}/${file.name}` : file.name,
      content,
    });
    return;
  }

  if (entry.isDirectory) {
    const reader = entry.createReader();
    const readBatch = () =>
      new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });

    let entries = await readBatch();
    while (entries.length) {
      for (const child of entries) {
        const childPath = path ? `${path}/${child.name}` : child.name;
        await walkEntry(child, childPath, collected);
      }
      entries = await readBatch();
    }
  }
}
