export async function readJson<T>(response: Response, endpoint: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();

  try {
    return JSON.parse(raw) as T;
  } catch {
    const trimmed = raw.trimStart();
    const looksLikeSource =
      trimmed.startsWith("import ") ||
      trimmed.startsWith("const ") ||
      trimmed.startsWith("export ") ||
      trimmed.startsWith("function ");

    if (looksLikeSource) {
      throw new Error(
        `Platform API route ${endpoint} is being served as source code instead of running as a Vercel Function. ` +
        `Use \"npm run dev\" (Vercel dev) locally and redeploy Platform on Vercel.`,
      );
    }

    const preview = raw.replace(/\s+/g, " ").slice(0, 140);
    throw new Error(
      `Platform API route ${endpoint} returned ${contentType || "a non-JSON response"}` +
      (preview ? `: ${preview}` : "."),
    );
  }
}

export async function apiError(response: Response, endpoint: string): Promise<string> {
  try {
    const body = await readJson<{ error?: string }>(response, endpoint);
    return body.error || `Request failed with status ${response.status}.`;
  } catch (error) {
    return error instanceof Error ? error.message : `Request failed with status ${response.status}.`;
  }
}
