-- AlterTable: image design controls (typography, colors, effects)
ALTER TABLE `Profile` ADD COLUMN `designFontStyle` VARCHAR(191) NULL;
ALTER TABLE `Profile` ADD COLUMN `designFontSize` VARCHAR(191) NULL;
ALTER TABLE `Profile` ADD COLUMN `designFontColor` VARCHAR(191) NULL;
ALTER TABLE `Profile` ADD COLUMN `designEffects` TEXT NULL;
ALTER TABLE `Profile` ADD COLUMN `designNotes` TEXT NULL;
