import { isEditorRequest } from "../../../lib/editor-auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Editor-Password",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  if (!isEditorRequest(request)) {
    return Response.json({ error: "密碼不正確" }, { status: 401, headers: corsHeaders });
  }
  return Response.json({ authenticated: true }, { headers: corsHeaders });
}
