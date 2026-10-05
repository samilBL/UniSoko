export async function readApiResponse<T extends { error?: string }>(response: Response): Promise<T> {
  const raw = await response.text();
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === 'object') return value as T;
  } catch { /* Next.js, proxies, and hosting platforms can return plain text for errors. */ }

  const plainText = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const error = /request entity too large|payload too large|body too large/i.test(plainText)
    ? 'The image is larger than the server accepts. Choose a smaller photo or use the direct secure upload again.'
    : plainText && plainText.length <= 240
      ? plainText
      : `The server returned an unexpected response (${response.status}). Please retry, and contact UniSoko support if this continues.`;
  return { error } as T;
}
