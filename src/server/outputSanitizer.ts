const DEFAULT_MAX_OUTPUT_LENGTH = 12_000;
const REDACTION = "[REDACTED]";

const sensitivePatterns: Array<[RegExp, string]> = [
  [/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{12,}/gi, `$1${REDACTION}`],
  [/\b(api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|passwd|pwd)\b\s*[:=]\s*["']?[^"'\s&;]+["']?/gi, `$1=${REDACTION}`],
  [/\b(GH[PORSU]_[A-Za-z0-9_]{16,})\b/gi, REDACTION],
  [/\b(sk-[A-Za-z0-9_-]{20,})\b/g, REDACTION],
];

export function redactSensitiveText(value = "") {
  return sensitivePatterns.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

export function truncateOutput(value = "", maxLength = DEFAULT_MAX_OUTPUT_LENGTH) {
  if (value.length <= maxLength) return value;

  const omitted = value.length - maxLength;
  return `${value.slice(0, maxLength)}\n...[truncated ${omitted} chars]`;
}

export function sanitizeOutput(value = "", maxLength = DEFAULT_MAX_OUTPUT_LENGTH) {
  return truncateOutput(redactSensitiveText(value), maxLength);
}
