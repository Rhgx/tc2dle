type CellSpan = {
  cell: Element;
  remaining: number;
};

export function cleanText(value: unknown): string {
  return String(value || "")
    .replace(/\[[^\]]*edit[^\]]*\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function textWithBreaks(element: Element): string[] {
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll("script, style, .mw-editsection, sup").forEach((node) => node.remove());
  clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return (clone.textContent || "").split("\n").map(cleanText).filter(Boolean);
}

export function cellText(element: Element | null | undefined): string {
  if (!element) return "";
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll("script, style, .mw-editsection, sup, img").forEach((node) => node.remove());
  clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return (clone.textContent || "").split("\n").map(cleanText).filter(Boolean).join(" | ");
}

export function normalizeName(value: unknown): string {
  return cleanText(value).replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

export function getHeadingText(element: Element): string {
  return cleanText(element.querySelector(".mw-headline")?.textContent || element.textContent);
}

export function tableToGrid(table: Element): Element[][] {
  const grid: Element[][] = [];
  const spans: Array<CellSpan | null> = [];
  const rows = [...table.querySelectorAll("tr")];

  rows.forEach((row, rowIndex) => {
    const gridRow: Element[] = [];
    let colIndex = 0;

    colIndex = applyPendingSpans(gridRow, spans, colIndex);

    [...row.children].forEach((cell) => {
      colIndex = applyPendingSpans(gridRow, spans, colIndex);

      const colspan = Number(cell.getAttribute("colspan") || 1);
      const rowspan = Number(cell.getAttribute("rowspan") || 1);
      for (let i = 0; i < colspan; i += 1) {
        gridRow[colIndex + i] = cell;
        if (rowspan > 1) spans[colIndex + i] = { cell, remaining: rowspan - 1 };
      }
      colIndex += colspan;
    });

    applyPendingSpans(gridRow, spans, colIndex);

    grid[rowIndex] = gridRow;
  });

  return grid;
}

function applyPendingSpans(row: Element[], spans: Array<CellSpan | null>, startIndex: number): number {
  let colIndex = startIndex;

  while (spans[colIndex]) {
    const span = spans[colIndex]!;
    row[colIndex] = span.cell;
    span.remaining -= 1;
    if (span.remaining <= 0) spans[colIndex] = null;
    colIndex += 1;
  }

  return colIndex;
}
