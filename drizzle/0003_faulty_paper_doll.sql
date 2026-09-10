CREATE TABLE `intelligence_cache` (
	`symbol` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`fetched_at` integer NOT NULL,
	PRIMARY KEY(`symbol`, `kind`)
);
