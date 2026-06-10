-- CreateTable
CREATE TABLE `Profile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `igUserId` VARCHAR(191) NOT NULL DEFAULT '',
    `igUsername` VARCHAR(191) NULL,
    `accessToken` TEXT NOT NULL,
    `topics` TEXT NOT NULL,
    `brandName` VARCHAR(191) NULL,
    `brandDescription` TEXT NULL,
    `brandColors` VARCHAR(191) NULL,
    `brandStyle` VARCHAR(191) NULL,
    `brandLogoUrl` TEXT NULL,
    `brandExtra` TEXT NULL,
    `linkUrl` VARCHAR(191) NULL,
    `useLogo` BOOLEAN NOT NULL DEFAULT false,
    `lessText` BOOLEAN NOT NULL DEFAULT false,
    `autopost` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed default profile (id=1) from existing Config rows.
-- Instagram credentials stay empty so they fall back to INSTAGRAM_* env vars.
INSERT INTO `Profile` (
    `id`, `name`, `igUserId`, `igUsername`, `accessToken`, `topics`,
    `brandName`, `brandDescription`, `brandColors`, `brandStyle`,
    `brandLogoUrl`, `brandExtra`, `linkUrl`, `useLogo`, `lessText`,
    `autopost`, `active`, `createdAt`
) VALUES (
    1,
    'Perfil Principal',
    '',
    NULL,
    '',
    COALESCE((SELECT `value` FROM `Config` WHERE `key` = 'post_topic'), 'Technology'),
    (SELECT `value` FROM `Config` WHERE `key` = 'brand_name'),
    (SELECT `value` FROM `Config` WHERE `key` = 'brand_description'),
    (SELECT `value` FROM `Config` WHERE `key` = 'brand_colors'),
    (SELECT `value` FROM `Config` WHERE `key` = 'brand_style'),
    (SELECT `value` FROM `Config` WHERE `key` = 'brand_logo_url'),
    (SELECT `value` FROM `Config` WHERE `key` = 'brand_extra'),
    NULL,
    COALESCE((SELECT `value` FROM `Config` WHERE `key` = 'brand_use_logo') = 'true', false),
    COALESCE((SELECT `value` FROM `Config` WHERE `key` = 'brand_less_text') = 'true', false),
    COALESCE((SELECT `value` FROM `Config` WHERE `key` = 'autopost') = 'true', false),
    true,
    CURRENT_TIMESTAMP(3)
);

-- AlterTable: attach existing posts to the default profile
ALTER TABLE `Post` ADD COLUMN `profileId` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX `Post_profileId_idx` ON `Post`(`profileId`);

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
