-- F-007: emails are case-insensitive. Normalise existing rows and enforce
-- uniqueness on the lower-cased value. All application entry points also
-- normalise (NFKC, trim, lower) before any lookup, insert or rate-limit key.
UPDATE "User" SET "email" = lower("email");
CREATE UNIQUE INDEX "User_email_lower_key" ON "User" (lower("email"));
