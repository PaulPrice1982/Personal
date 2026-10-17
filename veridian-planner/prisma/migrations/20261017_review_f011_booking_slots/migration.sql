-- F-011: the database itself stops double bookings and a third half day.
-- Run the duplicate check first and resolve any rows it returns by hand:
--   SELECT "userId","date","slot",count(*) FROM "Booking"
--   WHERE "deliveryState" NOT IN ('CANCELLED_IN_TIME','CANCELLED_LATE','CANCELLED_BY_CONSULTANT','MOVED')
--   GROUP BY 1,2,3 HAVING count(*)>1;

-- one live full day per user per date
CREATE UNIQUE INDEX booking_full_day_live ON "Booking" ("userId", "date")
  WHERE "slot" IS NULL AND "deliveryState" NOT IN ('CANCELLED_IN_TIME','CANCELLED_LATE','CANCELLED_BY_CONSULTANT','MOVED');
-- one live AM and one live PM per user per date
CREATE UNIQUE INDEX booking_half_day_live ON "Booking" ("userId", "date", "slot")
  WHERE "slot" IS NOT NULL AND "deliveryState" NOT IN ('CANCELLED_IN_TIME','CANCELLED_LATE','CANCELLED_BY_CONSULTANT','MOVED');
-- a client booking must name a client; a non-client booking must not
ALTER TABLE "Booking" ADD CONSTRAINT booking_kind_client
  CHECK (("kind" = 'CLIENT') = ("clientId" IS NOT NULL));
