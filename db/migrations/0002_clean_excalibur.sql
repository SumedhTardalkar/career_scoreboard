CREATE TABLE `health_checkins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week` text NOT NULL,
	`weight_grams` integer,
	`muscle_mass_grams` integer,
	`outcome` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL
);
