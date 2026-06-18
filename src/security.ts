const LOCAL_HTTP_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

export function isAllowedApiBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol === 'http:' &&
      LOCAL_HTTP_HOSTS.has(parsed.hostname)
    ) {
      return true;
    }
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSafeExternalUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeStatusBarText(text: string): string {
  return text.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80);
}

export function toSafeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.name;
  }
  return 'unknown';
}
