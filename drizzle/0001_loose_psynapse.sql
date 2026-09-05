ALTER TABLE `bboxes` DROP FOREIGN KEY `bboxes_image_id_images_id_fk`;
--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `name` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `images` MODIFY COLUMN `mimetype` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `images` MODIFY COLUMN `url` varchar(512) NOT NULL;--> statement-breakpoint
ALTER TABLE `bboxes` ADD CONSTRAINT `bboxes_image_id_images_id_fk` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE cascade ON UPDATE no action;