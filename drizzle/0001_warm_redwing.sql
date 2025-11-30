CREATE TABLE `cameras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`streamUrl` varchar(512) NOT NULL,
	`location` varchar(255),
	`status` enum('active','inactive','error') NOT NULL DEFAULT 'inactive',
	`cameraType` varchar(64) DEFAULT 'IP',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cameras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `detections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cameraId` int NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`personCount` int NOT NULL DEFAULT 0,
	`chairCount` int NOT NULL DEFAULT 0,
	`occupancyRate` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `detections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cameraId` int NOT NULL,
	`startTime` timestamp NOT NULL DEFAULT (now()),
	`endTime` timestamp,
	`status` enum('active','completed','error') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoring_sessions_id` PRIMARY KEY(`id`)
);
