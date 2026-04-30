export function formatError(err: unknown): string {
  if (err instanceof Error) {
    const anyErr = err as Error & { logs?: unknown; cause?: unknown };
    const lines = [err.message];
    if (anyErr.logs) {
      lines.push(`logs=${JSON.stringify(anyErr.logs)}`);
    }
    if (anyErr.cause) {
      lines.push(`cause=${String(anyErr.cause)}`);
    }
    if (err.stack) {
      lines.push(err.stack);
    }
    return lines.join("\n");
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
