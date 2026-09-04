CREATE TABLE `annotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`image_id` int NOT NULL,
	`category_id` int NOT NULL,
	`x` float NOT NULL,
	`y` float NOT NULL,
	`width` float NOT NULL,
	`height` float NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `annotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(7) NOT NULL,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`object_key` varchar(255) NOT NULL,
	`width` int,
	`height` int,
	`mime` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `images_id` PRIMARY KEY(`id`),
	CONSTRAINT `images_object_key_unique` UNIQUE(`object_key`)
);
--> statement-breakpoint
ALTER TABLE `annotations` ADD CONSTRAINT `annotations_image_id_images_id_fk` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `annotations` ADD CONSTRAINT `annotations_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `category_id_idx` ON `annotations` (`category_id`);--> statement-breakpoint
CREATE INDEX `image_id_idx` ON `annotations` (`image_id`);--> statement-breakpoint
CREATE INDEX `annotation_created_at_idx` ON `annotations` (`created_at`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `images` (`created_at`);