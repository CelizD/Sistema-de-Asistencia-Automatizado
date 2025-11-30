ALTER TABLE `cameras` MODIFY COLUMN `streamUrl` text NOT NULL;--> statement-breakpoint
ALTER TABLE `cameras` MODIFY COLUMN `status` enum('active','inactive','error') DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `cameras` MODIFY COLUMN `cameraType` varchar(100);--> statement-breakpoint
ALTER TABLE `cameras` ADD `roomId` int;