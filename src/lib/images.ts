// Wraps the course's image-generation proxy (see /topics/generating-images on
// the course site). Same `sk-` key as Claude Code, same strproxy host — set
// STRPROXY_KEY in an untracked .env locally, and `fly secrets set
// STRPROXY_KEY=...` before this runs deployed. Never call this in a test that
// runs on every `pnpm check`: each image costs real budget ($0.10, 300 total
// for the course, no reset).
const BASE_URL = "https://strproxy.comp.anu.edu.au";

export interface GeneratedImage {
  url: string;
}

export interface ImageModelInfo {
  id: string;
  [key: string]: unknown;
}

function requireKey(): string {
  const key = process.env.STRPROXY_KEY;
  if (!key) {
    throw new Error(
      "STRPROXY_KEY is not set — add it to an untracked .env locally, and " +
        "`fly secrets set STRPROXY_KEY=...` before this runs deployed",
    );
  }
  return key;
}

// The wire format is OpenAI's images API, proxied over Replicate — pass
// whatever `model` /api/images/models currently allows (e.g. "flux-schnell").
export async function generateImage(
  prompt: string,
  opts: { model?: string; size?: string; n?: number } = {},
): Promise<GeneratedImage[]> {
  const res = await fetch(`${BASE_URL}/api/images/generations`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${requireKey()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: "flux-schnell", prompt, ...opts }),
  });
  if (!res.ok) {
    throw new Error(`image generation failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { data: GeneratedImage[] };
  return json.data;
}

// Lists the current allowed models, sizes, per-image price and remaining
// image budget — ask this instead of hardcoding the allowlist.
export async function listImageModels(): Promise<ImageModelInfo[]> {
  const res = await fetch(`${BASE_URL}/api/images/models`, {
    headers: { authorization: `Bearer ${requireKey()}` },
  });
  if (!res.ok) {
    throw new Error(`listing image models failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// The returned URL points at Replicate's delivery CDN and expires — the
// proxy stores no image bytes. Fetch and persist the bytes immediately if
// you want to keep the image.
export async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`downloading generated image failed: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
