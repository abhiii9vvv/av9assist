// Lightweight auto-formatter for AI text responses -> Markdown
// Heuristics: detect existing Markdown; if present, return as-is unless `force` is true.
// Otherwise, construct a template with Title, Summary, Sections, and optional Code blocks.

function hasMarkdownStructure(text) {
  if (!text) return false;
  // Headings, lists, fenced code, tables, emphasis
  const patterns = [
    /^\s*#{1,6}\s+.+/m,
    /^\s*[-*+]\s+.+/m,
    /```[\s\S]*?```/,
    /^\s*\d+\.\s+.+/m,
    /\|[^\n]+\|/,
  ];
  return patterns.some((re) => re.test(text));
}

function extractTitle(text) {
  // First sentence or up to 80 chars.
  const firstLine = text.trim().split(/\n+/)[0].trim();
  const sentence = firstLine.split(/(?<=[.!?])\s+/)[0];
  const cleaned = sentence.replace(/[`*_#>]+/g, "").trim();
  return cleaned.slice(0, 80) || "AI Response";
}

function summarize(text, max = 220) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function splitSections(text) {
  // Split by double newline as rough paragraphs/sections
  const parts = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts;
}

function detectCodeBlocks(text) {
  // Only include explicitly fenced code blocks
  const fenced = [...text.matchAll(/```(\w+)?\n([\s\S]*?)```/g)].map((m) => ({
    lang: (m[1] || "").trim(),
    code: m[2] || "",
  }));
  return fenced;
}

export function autoFormatResponse(text, options = {}) {
  const { force = false, title: titleOpt } = options;
  if (!text || typeof text !== "string") return "";

  // If it already looks like structured Markdown and not forcing, return as-is
  if (!force && hasMarkdownStructure(text)) return text;

  const title = titleOpt || extractTitle(text);
  const sections = splitSections(text).map((s) => s.length > 1200 ? s.slice(0, 1200) + "…" : s);

  // Avoid repeating the first sentence in both the title and body.
  // If the first section starts with the title (ignoring simple markdown symbols and case),
  // strip it out from the body and trim leading punctuation like ", : - —".
  const clean = (s) => (s || "").replace(/[`*_#>]+/g, "").trim();
  if (sections.length > 0) {
    const s0 = sections[0];
    const s0Clean = clean(s0).toLowerCase();
    const titleClean = clean(title).toLowerCase();
    if (s0Clean.startsWith(titleClean)) {
      // Remove the matching title-length prefix from the original (preserve original spacing/punct afterwards)
      const idx = s0.toLowerCase().indexOf(clean(title).toLowerCase());
      let remaining = idx >= 0 ? s0.slice(idx + clean(title).length) : s0;
      // Remove an immediate leading punctuation/space after the title
      remaining = remaining.replace(/^\s*[:;,\-–—]\s*/u, "");
      sections[0] = remaining.trim();
    }
  }

  const plainBody = sections.filter(Boolean).join("\n\n");
  const codes = detectCodeBlocks(text);

  let md = `# ${title}\n\n`;
  // Keep original body without adding a Summary or Sections block
  if (plainBody) md += plainBody.trim() + "\n\n";

  if (codes.length) {
    md += `## Code\n\n`;
    for (const { lang, code } of codes) {
      const language = lang || inferLanguage(code);
      md += "```" + (language || "") + "\n" + code.trimEnd() + "\n```\n\n";
    }
  }

  return md.trim() + "\n";
}

function inferLanguage(code) {
  // crude heuristics
  if (/\b(import|export|const|let|var|from)\b/.test(code)) return "javascript";
  if (/\b(def|import\s+\w+|print\()\b/.test(code)) return "python";
  if (/\b#include\b|std::/.test(code)) return "cpp";
  if (/<[^>]+>/.test(code) && /\bclass(Name)?=/.test(code)) return "html";
  if (/SELECT\b|FROM\b|WHERE\b/i.test(code)) return "sql";
  return "";
}

export default autoFormatResponse;
