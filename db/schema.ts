import {
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  name: text("name").notNull(),

  slug: text("slug").notNull().unique(),

  inputType: text("input_type", {
    enum: ["duration", "quantity", "health"],
  }).notNull(),

  unit: text("unit").notNull(),

  target: integer("target").notNull(),

  weight: integer("weight").notNull(),

  archived: integer("archived", {
    mode: "boolean",
  })
    .notNull()
    .default(false),

  createdAt: integer("created_at", {
    mode: "timestamp",
  })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  date: text("date").notNull(),

  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),

  title: text("title").notNull(),

  durationMinutes: integer("duration_minutes"),

  quantity: integer("quantity"),

  notes: text("notes"),

  createdAt: integer("created_at", {
    mode: "timestamp",
  })
    .notNull()
    .$defaultFn(() => new Date()),
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

  createdAt: integer("created_at", {
    mode: "timestamp",
  })
    .notNull()
    .$defaultFn(() => new Date()),
});
