CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`data` text NOT NULL,
	`total` integer NOT NULL,
	`demo` integer NOT NULL,
	`status` text DEFAULT 'menunggu konfirmasi' NOT NULL,
	`payment` text DEFAULT 'belum dibayar' NOT NULL,
	`tracking` text DEFAULT '' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_token_unique` ON `orders` (`token`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`stock` integer NOT NULL,
	CONSTRAINT "nonnegative_stock" CHECK("variants"."stock" >= 0)
);
