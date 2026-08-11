import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { calendarPlans } from "../../../db/schema";
import { isEditorRequest } from "../../../lib/editor-auth";

type OfficeStatus = "office" | "away" | "unset";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Editor-Password",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const rows = await getDb().select().from(calendarPlans);
    const plans = Object.fromEntries(rows.map((row) => [row.date, {
      office: row.office as OfficeStatus,
      city: row.city,
      work: row.work,
    }]));
    return Response.json({ plans }, { headers: { ...corsHeaders, "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "無法讀取行程";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: Request) {
  if (!isEditorRequest(request)) {
    return Response.json({ error: "編輯授權已失效，請重新輸入密碼" }, { status: 401, headers: corsHeaders });
  }

  try {
    const payload = (await request.json()) as {
      date?: string;
      office?: OfficeStatus;
      city?: string;
      work?: string;
    };
    const date = payload.date ?? "";
    const office = payload.office ?? "unset";
    const city = payload.city?.trim().slice(0, 12) ?? "";
    const work = payload.work?.trim().slice(0, 60) ?? "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < "2026-08-12" || date > "2027-08-31") {
      return Response.json({ error: "日期不在行事曆範圍內" }, { status: 400, headers: corsHeaders });
    }
    if (!["office", "away", "unset"].includes(office)) {
      return Response.json({ error: "到公司狀態不正確" }, { status: 400, headers: corsHeaders });
    }

    const db = getDb();
    if (office === "unset" && !city && !work) {
      await db.delete(calendarPlans).where(eq(calendarPlans.date, date));
      return Response.json({ deleted: true }, { headers: corsHeaders });
    }

    const plan = { date, office, city, work, updatedAt: new Date().toISOString() };
    await db.insert(calendarPlans).values(plan).onConflictDoUpdate({
      target: calendarPlans.date,
      set: { office, city, work, updatedAt: plan.updatedAt },
    });
    return Response.json({ plan: { office, city, work } }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "無法儲存行程";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
