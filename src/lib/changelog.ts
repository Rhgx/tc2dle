import changelogMarkdown from "../../CHANGELOG.md?raw";

export type ChangelogBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: ChangelogListItem[] };

export type ChangelogListItem = {
  text: string;
  children: ChangelogListItem[];
};

export type ChangelogEntry = {
  version: string;
  date: string;
  blocks: ChangelogBlock[];
};

export const changelogEntries = parseChangelog(changelogMarkdown);
export const currentSiteVersion = changelogEntries[0]?.version || "0.0.0";

function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  let currentEntry: ChangelogEntry | undefined;
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const entryMatch = line.match(/^##\s+v?([^\s-]+)\s*-\s*(\d{4}-\d{2}-\d{2})\s*$/);

    if (entryMatch) {
      currentEntry = { version: entryMatch[1], date: entryMatch[2], blocks: [] };
      entries.push(currentEntry);
      continue;
    }

    if (!currentEntry || !line.trim() || line.startsWith("# ")) continue;

    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) {
      currentEntry.blocks.push({ type: "heading", text: headingMatch[1].trim() });
      continue;
    }

    if (isListItem(line)) {
      const listLines: string[] = [];
      while (index < lines.length && (isListItem(lines[index]) || !lines[index].trim())) {
        if (lines[index].trim()) listLines.push(lines[index]);
        index += 1;
      }
      index -= 1;
      currentEntry.blocks.push({ type: "list", items: parseList(listLines) });
      continue;
    }

    const paragraphLines = [line.trim()];
    while (index + 1 < lines.length && lines[index + 1].trim() && !lines[index + 1].startsWith("#") && !isListItem(lines[index + 1])) {
      index += 1;
      paragraphLines.push(lines[index].trim());
    }
    currentEntry.blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return entries;
}

function parseList(lines: string[]) {
  const root: ChangelogListItem[] = [];
  const stack: Array<{ indent: number; items: ChangelogListItem[] }> = [{ indent: -1, items: root }];

  for (const line of lines) {
    const match = line.match(/^(\s*)-\s+(.+)$/);
    if (!match) continue;

    const indent = match[1].length;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const item = { text: match[2].trim(), children: [] };
    stack[stack.length - 1].items.push(item);
    stack.push({ indent, items: item.children });
  }

  return root;
}

function isListItem(line: string) {
  return /^\s*-\s+/.test(line);
}
