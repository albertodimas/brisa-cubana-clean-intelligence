-- Remove unused RefreshToken table
DROP TABLE IF EXISTS "RefreshToken";

-- Remove unused phone column from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "phone";

-- Remove unused assignedStaffId column from Booking
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "assignedStaffId";
