CREATE TABLE `votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`voter_key` text NOT NULL,
	`symbol` text NOT NULL,
	`rating` text NOT NULL,
	`vote_day` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_votes_voter_symbol_day` ON `votes` (`voter_key`,`symbol`,`vote_day`);--> statement-breakpoint
CREATE INDEX `idx_votes_symbol_rating` ON `votes` (`symbol`,`rating`);--> statement-breakpoint
CREATE INDEX `idx_votes_voter_created` ON `votes` (`voter_key`,`created_at`);
--> statement-breakpoint
PRAGMA optimize;
