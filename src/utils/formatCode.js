import { normalizeCodeLanguage } from "../components/CodeBlockEditor";

const PARSER_BY_LANGUAGE = {
  javascript: "babel",
  html: "html",
  css: "css",
  json: "json",
};

async function loadPlugins(parser) {
  if (parser === "babel" || parser === "json") {
    const [babel, estree] = await Promise.all([
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
    ]);
    return [babel.default, estree.default];
  }
  if (parser === "html") {
    const html = await import("prettier/plugins/html");
    return [html.default];
  }
  if (parser === "css") {
    const postcss = await import("prettier/plugins/postcss");
    return [postcss.default];
  }
  return [];
}

export function canFormatWithPrettier(language) {
  const lang = normalizeCodeLanguage(language);
  return lang in PARSER_BY_LANGUAGE;
}

export async function formatCodeWithPrettier(code, language) {
  const lang = normalizeCodeLanguage(language);
  const parser = PARSER_BY_LANGUAGE[lang];

  if (!parser) {
    return {
      ok: false,
      error: "Prettier supports JavaScript, HTML, CSS, and JSON only. Change the language dropdown to format.",
    };
  }

  const trimmed = (code || "").trim();
  if (!trimmed) {
    return { ok: false, error: "Nothing to format." };
  }

  try {
    const prettier = (await import("prettier/standalone")).default;
    const plugins = await loadPlugins(parser);
    const formatted = await prettier.format(code, {
      parser,
      plugins,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: false,
      trailingComma: "es5",
      bracketSameLine: false,
      htmlWhitespaceSensitivity: "css",
    });
    return { ok: true, formatted: formatted.replace(/\n$/, "") };
  } catch (err) {
    return {
      ok: false,
      error: err?.message || "Could not format — check for syntax errors.",
    };
  }
}
