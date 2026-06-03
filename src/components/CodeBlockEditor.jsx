import EditorImport from "react-simple-code-editor";

const Editor = EditorImport.default ?? EditorImport;
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-php";
import "prismjs/themes/prism-tomorrow.css";
import "../styles/code-editor.css";

export const CODE_LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "json", label: "JSON" },
  { id: "php", label: "PHP" },
  { id: "python", label: "Python" },
  { id: "bash", label: "Bash" },
];

const LANGUAGE_IDS = new Set(CODE_LANGUAGES.map((lang) => lang.id));

const GRAMMARS = {
  javascript: languages.javascript,
  html: languages.markup,
  css: languages.css,
  json: languages.json,
  php: languages.php,
  python: languages.python,
  bash: languages.bash,
};

const PRISM_IDS = {
  javascript: "javascript",
  html: "markup",
  css: "css",
  json: "json",
  php: "php",
  python: "python",
  bash: "bash",
};

export function normalizeCodeLanguage(language) {
  return LANGUAGE_IDS.has(language) ? language : "javascript";
}

export default function CodeBlockEditor({ value, onChange, language = "javascript", placeholder }) {
  const lang = normalizeCodeLanguage(language);
  const grammar = GRAMMARS[lang];
  const prismId = PRISM_IDS[lang];
  const lineCount = Math.max(1, value.split("\n").length);

  return (
    <Editor
      value={value}
      onValueChange={onChange}
      highlight={(code) => highlight(code, grammar, prismId)}
      placeholder={placeholder}
      spellCheck={false}
      padding={0}
      className="code-block-editor custom-scrollbar"
      textareaClassName="code-block-editor__textarea"
      preClassName="code-block-editor__pre"
      style={{ minHeight: `${Math.max(140, lineCount * 24 + 32)}px` }}
    />
  );
}
