import { env } from "cloudflare:workers";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

export function isEditorRequest(request: Request) {
  const expected = (env as unknown as { EDITOR_PASSWORD?: string }).EDITOR_PASSWORD ?? "";
  const supplied = request.headers.get("x-editor-password") ?? "";
  return expected.length >= 8 && safeEqual(supplied, expected);
}
