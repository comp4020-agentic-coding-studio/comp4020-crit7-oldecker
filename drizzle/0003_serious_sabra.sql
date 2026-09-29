CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assessment_id` integer NOT NULL,
	`text_content` text,
	`file_name` text,
	`file_type` text,
	`file_data` blob,
	`submitted_at` text NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
