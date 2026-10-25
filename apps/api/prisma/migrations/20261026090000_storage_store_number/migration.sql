-- Each building can have its own number in the store part of its bin codes.
-- NULL keeps the format's fixed value, so existing codes stay as they are.
ALTER TABLE "Storage" ADD COLUMN "storeNumber" INTEGER;
