export const DEFAULT_TAGS: { name: string; category: TagCategoryValue }[] = [
  // Chart patterns — reversal
  { name: "Double top", category: "CHART_PATTERN" },
  { name: "Double bottom", category: "CHART_PATTERN" },
  { name: "Triple top", category: "CHART_PATTERN" },
  { name: "Triple bottom", category: "CHART_PATTERN" },
  { name: "Head & shoulders", category: "CHART_PATTERN" },
  { name: "Inverse head & shoulders", category: "CHART_PATTERN" },
  { name: "Rounding top", category: "CHART_PATTERN" },
  { name: "Rounding bottom", category: "CHART_PATTERN" },
  { name: "V-shaped reversal", category: "CHART_PATTERN" },
  // Chart patterns — continuation
  { name: "Bull flag", category: "CHART_PATTERN" },
  { name: "Bear flag", category: "CHART_PATTERN" },
  { name: "Pennant", category: "CHART_PATTERN" },
  { name: "Rising wedge", category: "CHART_PATTERN" },
  { name: "Falling wedge", category: "CHART_PATTERN" },
  { name: "Ascending triangle", category: "CHART_PATTERN" },
  { name: "Descending triangle", category: "CHART_PATTERN" },
  { name: "Symmetrical triangle", category: "CHART_PATTERN" },
  { name: "Rectangle / channel", category: "CHART_PATTERN" },
  { name: "Cup and handle", category: "CHART_PATTERN" },

  // Candlestick
  { name: "Doji", category: "CANDLESTICK" },
  { name: "Hammer", category: "CANDLESTICK" },
  { name: "Inverted hammer", category: "CANDLESTICK" },
  { name: "Shooting star", category: "CANDLESTICK" },
  { name: "Bullish engulfing", category: "CANDLESTICK" },
  { name: "Bearish engulfing", category: "CANDLESTICK" },
  { name: "Morning star", category: "CANDLESTICK" },
  { name: "Evening star", category: "CANDLESTICK" },
  { name: "Pin bar", category: "CANDLESTICK" },
  { name: "Inside bar", category: "CANDLESTICK" },
  { name: "Harami", category: "CANDLESTICK" },

  // Indicators
  { name: "MA crossover", category: "INDICATOR" },
  { name: "MA as support/resistance", category: "INDICATOR" },
  { name: "RSI overbought/oversold", category: "INDICATOR" },
  { name: "RSI divergence", category: "INDICATOR" },
  { name: "MACD crossover", category: "INDICATOR" },
  { name: "MACD divergence", category: "INDICATOR" },
  { name: "Stochastic overbought/oversold", category: "INDICATOR" },
  { name: "Bollinger Band squeeze", category: "INDICATOR" },
  { name: "Bollinger Band breakout", category: "INDICATOR" },
  { name: "ATR volatility context", category: "INDICATOR" },
  { name: "VWAP", category: "INDICATOR" },
  { name: "Volume profile", category: "INDICATOR" },
  { name: "Fibonacci retracement", category: "INDICATOR" },
  { name: "Fibonacci extension", category: "INDICATOR" },
  { name: "Ichimoku Cloud", category: "INDICATOR" },
  { name: "Parabolic SAR", category: "INDICATOR" },
  { name: "ADX trend strength", category: "INDICATOR" },

  // Smart money concepts / market structure
  { name: "Higher-high / higher-low structure", category: "SMC" },
  { name: "Lower-high / lower-low structure", category: "SMC" },
  { name: "Break of structure (BOS)", category: "SMC" },
  { name: "Change of character (CHoCH)", category: "SMC" },
  { name: "Order block", category: "SMC" },
  { name: "Breaker block", category: "SMC" },
  { name: "Fair value gap", category: "SMC" },
  { name: "Liquidity sweep", category: "SMC" },
  { name: "Inducement", category: "SMC" },
  { name: "Displacement", category: "SMC" },
  { name: "Premium zone", category: "SMC" },
  { name: "Discount zone", category: "SMC" },
  { name: "Killzone (London/NY open)", category: "SMC" },
  { name: "Supply zone", category: "SMC" },
  { name: "Demand zone", category: "SMC" },
  { name: "Horizontal support/resistance", category: "SMC" },
  { name: "Trendline break", category: "SMC" },

  // Context — timeframe
  { name: "1m", category: "CONTEXT" },
  { name: "5m", category: "CONTEXT" },
  { name: "15m", category: "CONTEXT" },
  { name: "1H", category: "CONTEXT" },
  { name: "4H", category: "CONTEXT" },
  { name: "Daily", category: "CONTEXT" },
  { name: "Weekly", category: "CONTEXT" },
  // Context — session
  { name: "Asian session", category: "CONTEXT" },
  { name: "London session", category: "CONTEXT" },
  { name: "NY session", category: "CONTEXT" },
  { name: "Pre-market", category: "CONTEXT" },
  { name: "After-hours", category: "CONTEXT" },
  // Context — market condition
  { name: "Trending", category: "CONTEXT" },
  { name: "Ranging", category: "CONTEXT" },
  { name: "Choppy", category: "CONTEXT" },
  { name: "Volatile", category: "CONTEXT" },
  // Context — catalyst
  { name: "News catalyst", category: "CONTEXT" },

  // Mistakes
  { name: "FOMO entry", category: "MISTAKE" },
  { name: "Moved stop loss", category: "MISTAKE" },
  { name: "Oversized position", category: "MISTAKE" },
  { name: "Revenge trade", category: "MISTAKE" },
  { name: "Ignored my plan", category: "MISTAKE" },
  { name: "Chased price", category: "MISTAKE" },
  { name: "No stop loss set", category: "MISTAKE" },
  { name: "Exited early (fear)", category: "MISTAKE" },
  { name: "Exited late (greed)", category: "MISTAKE" },
  { name: "Overtraded", category: "MISTAKE" },
  { name: "Hesitated on entry", category: "MISTAKE" },
  { name: "Averaged down without a plan", category: "MISTAKE" },

  // Emotions
  { name: "Calm", category: "EMOTION" },
  { name: "Confident", category: "EMOTION" },
  { name: "Anxious", category: "EMOTION" },
  { name: "Excited", category: "EMOTION" },
  { name: "Bored", category: "EMOTION" },
  { name: "Frustrated", category: "EMOTION" },
  { name: "Tilted", category: "EMOTION" },
  { name: "Hesitant", category: "EMOTION" },
  { name: "Impatient", category: "EMOTION" },
  { name: "Disciplined", category: "EMOTION" },
];

export type TagCategoryValue =
  | "CHART_PATTERN"
  | "CANDLESTICK"
  | "INDICATOR"
  | "SMC"
  | "CONTEXT"
  | "MISTAKE"
  | "EMOTION";

export const TAG_CATEGORY_LABELS: Record<TagCategoryValue, string> = {
  CHART_PATTERN: "Chart patterns",
  CANDLESTICK: "Candlestick",
  INDICATOR: "Indicators",
  SMC: "Smart money / structure",
  CONTEXT: "Context",
  MISTAKE: "Mistakes",
  EMOTION: "Emotions",
};

// Order they're presented in the picker — patterns first (most common lookup), context last.
export const TAG_CATEGORY_ORDER: TagCategoryValue[] = [
  "CHART_PATTERN",
  "CANDLESTICK",
  "INDICATOR",
  "SMC",
  "CONTEXT",
  "MISTAKE",
  "EMOTION",
];
