export type ImportedReadmeDetails = {
  name?: string;
  headline?: string;
  bio?: string;
  location?: string;
};

function cleanInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images → alt
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
    .replace(/[*_`~]+/g, "") // emphasis / code marks
    .replace(/<[^>]*>/g, "") // html tags
    .trim();
}

function stripEmojiTail(text: string): string {
  return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]+.*/gu, "").trim();
}

/** Pull a display name, role line, bio and location out of a profile README. */
export function parseReadmeDetails(markdown: string): ImportedReadmeDetails {
  const lines = markdown.split("\n");
  const out: ImportedReadmeDetails = {};

  // Name: "# Hey, I'm Maya 👋" / "# Hi, I'm X" / first "# ..." fallback.
  for (const line of lines) {
    const hi = line.match(/^#\s+(?:hey|hi|hello|yo)[,.]?\s+(?:i['’]m|i am)\s+(.+)/i);
    if (hi) {
      out.name = stripEmojiTail(cleanInline(hi[1]));
      break;
    }
  }
  if (!out.name) {
    const firstH1 = lines.map((l) => l.match(/^#\s+(.+)/)).find(Boolean);
    if (firstH1) out.name = stripEmojiTail(cleanInline(firstH1[1])).slice(0, 60);
  }

  // Headline: first blockquote, else first h3, else first bold line.
  const quote = lines.map((l) => l.match(/^>\s*(.+)/)).find(Boolean);
  if (quote) {
    out.headline = cleanInline(quote[1]).slice(0, 90);
  } else {
    const h3 = lines.map((l) => l.match(/^#{2,3}\s+(.+)/)).find(Boolean);
    if (h3 && !/^(things|find|contact|stats|tech|about)/i.test(h3[1])) {
      out.headline = cleanInline(h3[1]).slice(0, 90);
    }
  }

  // Bio: first substantial plain paragraph (skip headings, images, badges, tables).
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith(">") || t.startsWith("!") || t.startsWith("[") || t.startsWith("|") || t.startsWith("-") || t.startsWith("*") || t.startsWith("<")) continue;
    const cleaned = cleanInline(t);
    if (cleaned.length >= 20) {
      out.bio = cleaned.slice(0, 140);
      break;
    }
  }

  // Location: 📍 line or "based in ...".
  const pin = markdown.match(/📍\s*([^·|\n\]]+)/);
  if (pin) {
    out.location = cleanInline(pin[1]).slice(0, 60);
  } else {
    const based = markdown.match(/based in\s+([^.\n]+)/i);
    if (based) out.location = cleanInline(based[1]).slice(0, 60);
  }

  return out;
}
