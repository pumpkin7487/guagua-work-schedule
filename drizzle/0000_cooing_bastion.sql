CREATE TABLE `calendar_plans` (
	`date` text PRIMARY KEY NOT NULL,
	`office` text DEFAULT 'unset' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`work` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
