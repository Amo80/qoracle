type LogContext = Record<string, unknown>;

function sanitizeContext(context: LogContext) {
  return Object.fromEntries(
    Object.entries(context).filter(
      ([key]) => !/token|secret|password|authorization|cookie/i.test(key)
    )
  );
}

export function logError(error: unknown, context: LogContext = {}) {
  const normalized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };

  console.error("[qrystal-error]", {
    ...normalized,
    context: sanitizeContext(context),
  });
}

export function logWarning(message: string, context: LogContext = {}) {
  console.warn("[qrystal-warning]", message, sanitizeContext(context));
}
