ALTER TABLE `User` ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false;

-- The first account is the operator's own, so promote it: without this nobody
-- can reach /admin and the queue would be unreadable right after deploy.
UPDATE `User` SET `isAdmin` = true ORDER BY `id` LIMIT 1;

CREATE TABLE `AccessRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `igHandle` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `AccessRequest_userId_igHandle_key`(`userId`, `igHandle`),
    INDEX `AccessRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AccessRequest` ADD CONSTRAINT `AccessRequest_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
