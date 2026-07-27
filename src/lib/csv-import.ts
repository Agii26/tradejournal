export const IMPORT_FIELDS = [
  { key: "symbol", label: "Symbol", required: true },
  { key: "direction", label: "Direction", required: true },
  { key: "entryAt", label: "Entry date/time", required: true },
  { key: "entryPrice", label: "Entry price", required: true },
  { key: "quantity", label: "Quantity", required: true },
  { key: "exitAt", label: "Exit date/time", required: false },
  { key: "exitPrice", label: "Exit price", required: false },
  { key: "netPnl", label: "Net P&L (if the export already has it)", required: false },
  { key: "fees", label: "Fees", required: false },
  { key: "stopLoss", label: "Stop loss", required: false },
  { key: "target", label: "Target", required: false },
  { key: "exitReason", label: "Exit reason / notes", required: false },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];
export type ColumnMapping = Partial<Record<ImportFieldKey, string>>; // field -> CSV header name

export interface MappedTradeRow {
  rowIndex: number; // 1-based, for error messages
  symbol?: string;
  direction?: "LONG" | "SHORT";
  entryAt?: Date;
  entryPrice?: number;
  quantity?: number;
  exitAt?: Date;
  exitPrice?: number;
  netPnl?: number;
  fees?: number;
  stopLoss?: number;
  target?: number;
  exitReason?: string;
  errors: string[];
}

function normalizeDirection(raw: string | undefined): "LONG" | "SHORT" | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (["long", "buy", "l", "b"].includes(v)) return "LONG";
  if (["short", "sell", "s"].includes(v)) return "SHORT";
  return undefined;
}

function normalizeNumber(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  const cleaned = String(raw).replace(/[$,]/g, "").trim();
  if (cleaned === "") return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeDate(raw: string | undefined): Date | undefined {
  if (!raw || raw.trim() === "") return undefined;
  const trimmed = raw.trim();
  // Bare numeric strings are almost always Unix timestamps in an export,
  // not a JS-parseable date on their own.
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = trimmed.length > 10 ? num : num * 1000; // seconds vs. milliseconds
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Applies a confirmed column mapping to raw CSV rows (as produced by
 * Papa.parse with header:true — each row is {columnHeader: stringValue}).
 * Pure function, no I/O — fully unit-testable.
 */
export function applyMapping(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): MappedTradeRow[] {
  return rows.map((row, i) => {
    const get = (field: ImportFieldKey) => {
      const col = mapping[field];
      return col ? row[col] : undefined;
    };

    const errors: string[] = [];
    const symbol = get("symbol")?.trim() || undefined;
    const direction = normalizeDirection(get("direction"));
    const entryAt = normalizeDate(get("entryAt"));
    const entryPrice = normalizeNumber(get("entryPrice"));
    const quantity = normalizeNumber(get("quantity"));

    if (!symbol) errors.push("Missing symbol");
    if (!direction) {
      errors.push(
        mapping.direction
          ? `Unrecognized direction: "${get("direction")}"`
          : "Missing direction"
      );
    }
    if (!entryAt) errors.push("Missing/unparseable entry date");
    if (entryPrice === undefined) errors.push("Missing/invalid entry price");
    if (quantity === undefined) errors.push("Missing/invalid quantity");

    return {
      rowIndex: i + 1,
      symbol,
      direction,
      entryAt,
      entryPrice,
      quantity,
      exitAt: normalizeDate(get("exitAt")),
      exitPrice: normalizeNumber(get("exitPrice")),
      netPnl: normalizeNumber(get("netPnl")),
      fees: normalizeNumber(get("fees")),
      stopLoss: normalizeNumber(get("stopLoss")),
      target: normalizeNumber(get("target")),
      exitReason: get("exitReason")?.trim() || undefined,
      errors,
    };
  });
}
