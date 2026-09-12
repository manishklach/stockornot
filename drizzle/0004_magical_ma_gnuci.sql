ALTER TABLE `instruments` ADD `coverage_tier` text DEFAULT 'unclassified' NOT NULL;--> statement-breakpoint
ALTER TABLE `instruments` ADD `coverage_updated_at` integer;--> statement-breakpoint
CREATE INDEX `idx_instruments_coverage` ON `instruments` (`active`,`coverage_tier`);--> statement-breakpoint
DELETE FROM `intelligence_cache` WHERE `kind` IN ('news:24h', 'news:7d', 'news:30d') AND `payload` LIKE '%"total":0%';--> statement-breakpoint
DELETE FROM `intelligence_cache` WHERE `kind` IN ('macro:24h', 'macro:7d', 'macro:30d') AND `payload` = '[]';--> statement-breakpoint
UPDATE `instruments` SET `coverage_tier` = 'established' WHERE `symbol` IN ('AAPL', 'MU', 'NVDA', 'TSLA', 'AMD', 'MSFT', 'AMZN', 'META', 'GOOGL', 'NFLX', 'PLTR', 'AVGO');--> statement-breakpoint
UPDATE `instruments` SET `coverage_tier` = 'developing' WHERE `coverage_tier` = 'unclassified' AND `symbol` IN ('QQQ', 'VOO', 'SCHD', 'ARKK', 'IBIT', 'GME', 'RKLB', 'AAL', 'ABBV', 'ABT', 'ACN', 'ADBE', 'ADI', 'ADP', 'AEP', 'AMAT', 'ANET', 'APP', 'AVGO', 'AXP', 'BA', 'BAC', 'COST', 'CRM', 'CSCO', 'DIS', 'HOOD', 'JPM', 'KO', 'LLY', 'MRVL', 'ORCL', 'PYPL', 'SOFI', 'SPY', 'XOM');