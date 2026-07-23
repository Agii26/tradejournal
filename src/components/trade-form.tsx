"use client";

import { useActionState, useMemo, useState } from "react";
import { FormField, inputClass } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { computeTradeMetrics, type Direction } from "@/lib/trade-metrics";
import { assetClasses } from "@/lib/validation";

type ActionState = { error?: string } | undefined;
type TradingAccount = { id: string; name: string; type: string };

const toLocalInputValue = (d?: Date | string | null) => {
  if (!d) return "";
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export function TradeForm({
  tradingAccounts,
  action,
  defaultValues,
  submitLabel = "Log trade",
}: {
  tradingAccounts: TradingAccount[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    tradingAccountId?: string;
    symbol?: string;
    assetClass?: string;
    direction?: Direction;
    entryAt?: Date | string;
    exitAt?: Date | string | null;
    entryPrice?: number;
    exitPrice?: number | null;
    quantity?: number;
    stopLoss?: number | null;
    target?: number | null;
    exitReason?: string | null;
    riskAmount?: number | null;
    fees?: number | null;
    setupGrade?: string | null;
  };
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  const [direction, setDirection] = useState<Direction>(defaultValues?.direction ?? "LONG");
  const [entryPrice, setEntryPrice] = useState(defaultValues?.entryPrice?.toString() ?? "");
  const [exitPrice, setExitPrice] = useState(defaultValues?.exitPrice?.toString() ?? "");
  const [quantity, setQuantity] = useState(defaultValues?.quantity?.toString() ?? "");
  const [stopLoss, setStopLoss] = useState(defaultValues?.stopLoss?.toString() ?? "");
  const [target, setTarget] = useState(defaultValues?.target?.toString() ?? "");
  const [riskAmount, setRiskAmount] = useState(defaultValues?.riskAmount?.toString() ?? "");
  const [fees, setFees] = useState(defaultValues?.fees?.toString() ?? "");

  const preview = useMemo(() => {
    const ep = parseFloat(entryPrice);
    const qty = parseFloat(quantity);
    if (Number.isNaN(ep) || Number.isNaN(qty)) return null;
    return computeTradeMetrics({
      direction,
      entryPrice: ep,
      exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
      quantity: qty,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      target: target ? parseFloat(target) : undefined,
      riskAmount: riskAmount ? parseFloat(riskAmount) : undefined,
      fees: fees ? parseFloat(fees) : undefined,
    });
  }, [direction, entryPrice, exitPrice, quantity, stopLoss, target, riskAmount, fees]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <FormField label="Account" htmlFor="tradingAccountId">
          <select
            id="tradingAccountId"
            name="tradingAccountId"
            required
            defaultValue={defaultValues?.tradingAccountId}
            className={inputClass}
          >
            {tradingAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Symbol" htmlFor="symbol">
          <input
            id="symbol"
            name="symbol"
            required
            placeholder="EURUSD"
            defaultValue={defaultValues?.symbol}
            className={`${inputClass} uppercase`}
          />
        </FormField>

        <FormField label="Asset class" htmlFor="assetClass">
          <select
            id="assetClass"
            name="assetClass"
            required
            defaultValue={defaultValues?.assetClass ?? "FOREX"}
            className={inputClass}
          >
            {assetClasses.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div>
        <span className="mb-1.5 block text-[13px] font-medium text-ink">Direction</span>
        <div className="inline-flex overflow-hidden rounded-md border border-hairline">
          {(["LONG", "SHORT"] as const).map((d) => (
            <label
              key={d}
              className={`cursor-pointer px-4 py-2 text-sm font-medium transition-colors ${
                direction === d ? "bg-accent text-canvas" : "bg-surface text-muted hover:bg-accent-tint"
              }`}
            >
              <input
                type="radio"
                name="direction"
                value={d}
                checked={direction === d}
                onChange={() => setDirection(d)}
                className="sr-only"
              />
              {d === "LONG" ? "Long" : "Short"}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <FormField label="Entry date & time" htmlFor="entryAt">
          <input
            id="entryAt"
            name="entryAt"
            type="datetime-local"
            required
            defaultValue={toLocalInputValue(defaultValues?.entryAt)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Entry price" htmlFor="entryPrice">
          <input
            id="entryPrice"
            name="entryPrice"
            type="number"
            step="any"
            required
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </FormField>
        <FormField label="Quantity" htmlFor="quantity">
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="any"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <FormField label="Exit date & time" htmlFor="exitAt" hint="Leave blank if still open">
          <input
            id="exitAt"
            name="exitAt"
            type="datetime-local"
            defaultValue={toLocalInputValue(defaultValues?.exitAt)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Exit price" htmlFor="exitPrice">
          <input
            id="exitPrice"
            name="exitPrice"
            type="number"
            step="any"
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </FormField>
        <FormField label="Exit reason" htmlFor="exitReason">
          <input
            id="exitReason"
            name="exitReason"
            placeholder="Target hit"
            defaultValue={defaultValues?.exitReason ?? undefined}
            className={inputClass}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FormField label="Stop loss" htmlFor="stopLoss">
          <input
            id="stopLoss"
            name="stopLoss"
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </FormField>
        <FormField label="Target" htmlFor="target">
          <input
            id="target"
            name="target"
            type="number"
            step="any"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </FormField>
        <FormField label="Risk amount ($)" htmlFor="riskAmount">
          <input
            id="riskAmount"
            name="riskAmount"
            type="number"
            step="any"
            value={riskAmount}
            onChange={(e) => setRiskAmount(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </FormField>
        <FormField label="Fees" htmlFor="fees">
          <input
            id="fees"
            name="fees"
            type="number"
            step="any"
            value={fees}
            onChange={(e) => setFees(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </FormField>
      </div>

      <FormField label="Setup grade" htmlFor="setupGrade" hint="Optional — how clean was the setup?">
        <select
          id="setupGrade"
          name="setupGrade"
          defaultValue={defaultValues?.setupGrade ?? ""}
          className={inputClass}
        >
          <option value="">—</option>
          <option value="A+">A+</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
      </FormField>

      {preview && (
        <div className="rounded-lg border border-hairline bg-accent-tint px-5 py-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Gross P&L" value={preview.grossPnl} suffix="$" />
            <Metric label="Net P&L" value={preview.netPnl} suffix="$" />
            <Metric label="Realized R" value={preview.realizedR} suffix="R" />
            <Metric label="Planned R:R" value={preview.plannedRR} suffix="" />
          </div>
        </div>
      )}

      {state?.error && <p className="text-sm text-error">{state.error}</p>}

      <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
    </form>
  );
}

function Metric({ label, value, suffix }: { label: string; value?: number; suffix: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="tabular-nums text-lg font-medium text-ink">
        {value === undefined ? "—" : `${value > 0 && suffix === "$" ? "+" : ""}${value}${suffix}`}
      </div>
    </div>
  );
}
