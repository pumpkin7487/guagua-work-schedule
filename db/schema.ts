import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const calendarPlans = sqliteTable("calendar_plans", {
  date: text("date").primaryKey(),
  office: text("office").notNull().default("unset"),
  city: text("city").notNull().default(""),
  work: text("work").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
