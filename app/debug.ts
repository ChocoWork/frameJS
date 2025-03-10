const DEFAULT_DEBUGGER_URL =
  process.env.DEBUGGER_URL || "http://localhost:3010/";
  // process.env.DEBUGGER_URL || "http://109.123.242.59:3010/";

export const DEFAULT_DEBUGGER_HUB_URL =
  process.env.NODE_ENV === "development"
    ? new URL("/hub", DEFAULT_DEBUGGER_URL).toString()
    : undefined;
