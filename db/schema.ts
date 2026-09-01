import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  date: text("date").notNull(),

  category: text("category", {
    enum: [
      "coding",
      "dsa",
      "engineering",
      "project",
      "career",
      "health",
    ],
  }).notNull(),

  title: text("title").notNull(),

  durationMinutes: integer("duration_minutes"),

  quantity: integer("quantity"),

  notes: text("notes"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  category: text("category", {
    enum: [
      "coding",
      "dsa",
      "engineering",
      "project",
      "career",
      "health",
    ],
  }).notNull(),

  period: text("period", {
    enum: ["daily", "weekly", "monthly"],
  }).notNull(),

  target: integer("target").notNull(),
});

export const healthCheckins = sqliteTable("health_checkins", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  week: text("week").notNull().unique(),

  weightGrams: integer("weight_grams"),

  muscleMassGrams: integer("muscle_mass_grams"),

  outcome: text("outcome", {
    enum: [
      "lost_weight",
      "maintained_gained_muscle",
      "gained_gained_muscle",
      "maintained",
      "gained_weight",
      "gained_weight_lost_muscle",
    ],
  }).notNull(),

  notes: text("notes"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
