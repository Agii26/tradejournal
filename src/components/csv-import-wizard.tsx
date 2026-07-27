"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { IMPORT_FIELDS, applyMapping, type ColumnMapping, type MappedTradeRow } from "@/lib/csv-import";
import { bulkImportTrades, type ImportResult } from "@/lib/actions/import";
import { inputClass } from "@/components/form-field";

const AUTO_MAP_KEYWORDS: Record<string, string[]> = {
  symbol: ["symbol", "pair", "market", "instrument", "ticker"],
  direction: ["direction", "side", "type", "position"],
  entryAt: ["entrytime", "entrydate", "opentime", "opendate", "createtime", "time", "date"],
  entryPrice: ["entryprice", "openprice", "avgentry", "entry"],
  quantity: ["quantity", "qty", "size", "amount", "contracts", "volume"],
  exitAt: ["exittime", "exitdate", "closetime", "closedate"],
  exitPrice: ["exitprice", "closeprice", "avgexit", "exit"],
  netPnl: ["pnl", "profit", "netprofit", "realizedpnl", "realizedprofit"],
  fees: ["fee", "commission"],
  stopLoss: ["stoploss", "stop"],
  target: ["takeprofit", "target"],
  exitReason: ["reason", "note", "remark"],
};

function guessColumn(headers: string[], fieldKey: string): string | undefined {
  const keywords = AUTO_MAP_KEYWORDS[fieldKey] ?? [fieldKey.toLowerCase()];
  const cleaned = headers.map((h) => ({ raw: h, clean: h.toLowerCase().replace(/[^a-z]/g, "") }));
  for (const kw of keywords) {
    const hit = cleaned.find((h) => h.clean.includes(kw));
    if (hit) return hit.raw;
  }
  return undefined;
}

type Step = "upload" | "map" | "result";

export function CsvImportWizard({
  tradingAccounts,
}: {
  tradingAccounts: { id: string; name: string }[];
}) {
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [accountId, setAccountId] = useState(tradingAccounts[0]?.id ?? "");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const mappedRows: MappedTradeRow[] = useMemo(
    () => (rawRows.length > 0 ? applyMapping(rawRows, mapping) : []),
    [rawRows, mapping]
  );
  const validRows = mappedRows.filter((r) => r.errors.length === 0);
  const invalidRows = mappedRows.filter((r) => r.errors.length > 0);

  function onFile(file: File) {
    setFileError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.meta.fields || results.meta.fields.length === 0) {
          setFileError("Couldn't find a header row in that file");
          return;
        }
        setHeaders(results.meta.fields);
        setRawRows(results.data);

        // Best-effort auto-map by keyword matching, so most exports need
        // only a quick check rather than mapping every field by hand.
        const guess: ColumnMapping = {};
        for (const f of IMPORT_FIELDS) {
          const hit = guessColumn(results.meta.fields, f.key);
          if (hit) guess[f.key] = hit;
        }
        setMapping(guess);
        setStep("map");
      },
      error: (err) => setFileError(err.message),
    });
  }

  async function handleImport() {
    setIsImporting(true);
    const res = await bulkImportTrades(
      accountId,
      validRows.map((r) => ({
        symbol: r.symbol!,
        direction: r.direction!,
        entryAt: r.entryAt!,
        entryPrice: r.entryPrice!,
        quantity: r.quantity!,
        exitAt: r.exitAt,
        exitPrice: r.exitPrice,
        netPnl: r.netPnl,
        fees: r.fees,
        stopLoss: r.stopLoss,
        target: r.target,
        exitReason: r.exitReason,
      }))
    );
    setIsImporting(false);
    setResult(res);
    setStep("result");
  }

  if (step === "result" && result) {
    return (
      <div className="rounded-lg border border-hairline bg-surface px-6 py-6">
        <div className="mb-2 flex items-center gap-2 text-ink">
          <CheckCircle2 size={18} className="text-accent" />
          Imported {result.imported} trade{result.imported === 1 ? "" : "s"}
        </div>
        {result.failed.length > 0 && (
          <div className="mt-3 text-sm text-muted">
            {result.failed.length} row{result.failed.length === 1 ? "" : "s"} failed during import:
            <ul className="mt-1 list-inside list-disc">
              {result.failed.slice(0, 10).map((f) => (
                <li key={f.row}>
                  Row {f.row}: {f.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link href="/journal" className="mt-4 inline-block text-sm text-accent hover:underline">
          Go to journal →
        </Link>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-hairline bg-surface px-5 py-5">
          <h3 className="mb-3 text-sm font-medium text-ink">Map columns</h3>
          <p className="mb-4 text-xs text-muted">
            Guessed a few based on your header names — check them, especially Direction, since
            export formats vary.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {IMPORT_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs text-muted">
                  {f.label}
                  {f.required && <span className="text-error"> *</span>}
                </label>
                <select
                  value={mapping[f.key] ?? ""}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }))
                  }
                  className={inputClass}
                >
                  <option value="">— none —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-hairline bg-surface px-5 py-5">
          <label className="mb-1 block text-xs text-muted">Import into account</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
            {tradingAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-hairline bg-accent-tint px-5 py-4 text-sm">
          <span className="text-accent">{validRows.length} row{validRows.length === 1 ? "" : "s"} ready to import.</span>
          {invalidRows.length > 0 && (
            <span className="ml-2 text-muted">
              {invalidRows.length} row{invalidRows.length === 1 ? "" : "s"} will be skipped.
            </span>
          )}
        </div>

        {invalidRows.length > 0 && (
          <details className="rounded-lg border border-hairline bg-surface px-5 py-4">
            <summary className="cursor-pointer text-sm text-muted">
              <AlertTriangle size={13} className="mr-1 inline text-error" />
              View skipped rows
            </summary>
            <ul className="mt-3 space-y-1 text-xs text-muted">
              {invalidRows.slice(0, 20).map((r) => (
                <li key={r.rowIndex}>
                  Row {r.rowIndex}: {r.errors.join(", ")}
                </li>
              ))}
            </ul>
          </details>
        )}

        {validRows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-hairline">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-hairline text-muted">
                <tr>
                  <th className="px-3 py-2">Symbol</th>
                  <th className="px-3 py-2">Dir</th>
                  <th className="px-3 py-2">Entry</th>
                  <th className="px-3 py-2">Exit</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Net P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {validRows.slice(0, 5).map((r) => (
                  <tr key={r.rowIndex} className="border-b border-hairline last:border-0">
                    <td className="px-3 py-2 text-ink">{r.symbol}</td>
                    <td className="px-3 py-2 text-ink">{r.direction}</td>
                    <td className="px-3 py-2 tabular-nums text-ink">{r.entryPrice}</td>
                    <td className="px-3 py-2 tabular-nums text-ink">{r.exitPrice ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums text-ink">{r.quantity}</td>
                    <td className="px-3 py-2 tabular-nums text-ink">{r.netPnl ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validRows.length > 5 && (
              <div className="border-t border-hairline px-3 py-2 text-xs text-muted">
                + {validRows.length - 5} more
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("upload")}
            className="rounded-md border border-hairline px-4 py-2 text-sm text-ink hover:bg-accent-tint cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            disabled={validRows.length === 0 || !accountId || isImporting}
            onClick={handleImport}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {isImporting ? "Importing…" : `Import ${validRows.length} trade${validRows.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-hairline px-6 py-10 text-center">
      <Upload size={20} className="mx-auto mb-2 text-muted" />
      <p className="text-sm text-muted">
        Export your trade history as CSV, then{" "}
        <label className="cursor-pointer text-accent hover:underline">
          choose the file
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>
      </p>
      {fileError && <p className="mt-2 text-sm text-error">{fileError}</p>}
    </div>
  );
}
