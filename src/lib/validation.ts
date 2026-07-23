import { z } from "zod";

export const assetClasses = [
  "STOCK",
  "FOREX",
  "CRYPTO",
  "FUTURES",
  "OPTIONS",
  "INDEX",
] as const;

export const tradingAccountTypes = ["LIVE", "DEMO", "PROP_FIRM"] as const;

// z.union([z.coerce.number(), z.literal("")]) looks reasonable but is wrong:
// Number("") is 0 in JS, so the coerce branch succeeds on empty strings before
// the literal("") branch is ever tried, silently turning "" into 0. preprocess
// strips empty/nullish values before coercion runs at all.
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.coerce.number().optional()
);

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const tradeSchema = z
  .object({
    tradingAccountId: z.string().min(1, "Pick an account"),
    symbol: z
      .string()
      .min(1, "Required")
      .max(20)
      .transform((v) => v.toUpperCase().trim()),
    assetClass: z.enum(assetClasses),
    direction: z.enum(["LONG", "SHORT"]),
    entryAt: z.coerce.date({ message: "Required" }),
    exitAt: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.coerce.date().optional()
    ),
    entryPrice: z.coerce.number().positive("Must be positive"),
    exitPrice: optionalNumber,
    quantity: z.coerce.number().positive("Must be positive"),
    stopLoss: optionalNumber,
    target: optionalNumber,
    exitReason: optionalString,
    riskAmount: optionalNumber,
    fees: optionalNumber,
    setupGrade: optionalString,
  })
  .refine((data) => !data.exitPrice || data.exitAt, {
    message: "Exit date is required if exit price is set",
    path: ["exitAt"],
  });

export type TradeInput = z.infer<typeof tradeSchema>;

export const tradingAccountSchema = z.object({
  name: z.string().min(1, "Required").max(50),
  broker: z
    .string()
    .max(50)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  type: z.enum(tradingAccountTypes),
  startingBalance: z.coerce.number().min(0, "Must be 0 or more"),
});

export const signupSchema = z.object({
  name: z.string().min(1, "Required").max(80),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});
