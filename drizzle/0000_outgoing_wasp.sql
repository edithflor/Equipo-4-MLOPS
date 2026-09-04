CREATE TABLE `bboxes` (
	`id` varchar(36) NOT NULL,
	`image_id` varchar(36) NOT NULL,
	`category_id` int NOT NULL,
	`x` float NOT NULL,
	`y` float NOT NULL,
	`width` float NOT NULL,
	`height` float NOT NULL,
	CONSTRAINT `bboxes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(7) NOT NULL,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` varchar(36) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mimetype` varchar(50) NOT NULL,
	`size` int NOT NULL,
	`url` varchar(500) NOT NULL,
	CONSTRAINT `images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bboxes` ADD CONSTRAINT `bboxes_image_id_images_id_fk` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bboxes` ADD CONSTRAINT `bboxes_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;