-- AlterTable: multi-select image art styles (comma-separated). One is picked at random per post.
ALTER TABLE `Profile` ADD COLUMN `designImageStyles` TEXT NULL;
