-- AlterTable: logo variants — dark version (for light backgrounds) and square
-- icon, alongside the existing brandLogoUrl (light version, for dark backgrounds).
ALTER TABLE `Profile` ADD COLUMN `brandLogoDarkUrl` TEXT NULL;
ALTER TABLE `Profile` ADD COLUMN `brandLogoIconUrl` TEXT NULL;
