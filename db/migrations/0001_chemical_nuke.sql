CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`duration_minutes` integer,
	`quantity` integer,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`period` text NOT NULL,
	`target` integer NOT NULL
);
--> statement-breakpoint
DROP TABLE `test`;