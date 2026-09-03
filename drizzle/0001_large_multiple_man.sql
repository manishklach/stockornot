CREATE TABLE `market_cache` (
	`symbol` text NOT NULL,
	`range` text NOT NULL,
	`payload` text NOT NULL,
	`fetched_at` integer NOT NULL,
	PRIMARY KEY(`symbol`, `range`)
);
--> statement-breakpoint
CREATE INDEX `idx_market_cache_fetched` ON `market_cache` (`fetched_at`);
--> statement-breakpoint
PRAGMA optimize;
