-- AlterTable: multiselect brand options + per-profile scheduling
ALTER TABLE `Profile` ADD COLUMN `brandStyles` TEXT NULL;
ALTER TABLE `Profile` ADD COLUMN `postTones` TEXT NULL;
ALTER TABLE `Profile` ADD COLUMN `brandFormats` TEXT NULL;
ALTER TABLE `Profile` ADD COLUMN `brandPalette` TEXT NULL;
ALTER TABLE `Profile` ADD COLUMN `alternateStyles` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Profile` ADD COLUMN `scheduleDays` VARCHAR(64) NULL;
ALTER TABLE `Profile` ADD COLUMN `scheduleTimes` VARCHAR(191) NULL;
ALTER TABLE `Profile` ADD COLUMN `lastScheduledRunAt` DATETIME(3) NULL;

-- Keep existing profiles posting ~daily like before (16:00 America/Sao_Paulo ≈ old 19:00 UTC cron)
UPDATE `Profile` SET `scheduleDays` = '0,1,2,3,4,5,6', `scheduleTimes` = '16:00' WHERE `scheduleDays` IS NULL;
