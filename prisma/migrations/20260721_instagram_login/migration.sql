-- Existing profiles hold Facebook Page tokens, so 'facebook' is the right default
-- for every row already in the table as well as for manually pasted tokens.
ALTER TABLE `Profile` ADD COLUMN `authProvider` VARCHAR(191) NOT NULL DEFAULT 'facebook';
