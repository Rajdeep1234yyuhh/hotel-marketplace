import "dotenv/config";
import { backfillBookingReferences } from "../src/lib/db";

async function main() {
  const { bookings, packageBookings } = await backfillBookingReferences();
  console.log(
    `Backfilled references for ${bookings} hotel booking(s) and ${packageBookings} package booking(s).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
