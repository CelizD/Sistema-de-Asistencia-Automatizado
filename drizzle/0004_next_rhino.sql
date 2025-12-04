CREATE TABLE `schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cameras` ADD `username` varchar(255);--> statement-breakpoint
ALTER TABLE `cameras` ADD `password` varchar(255);