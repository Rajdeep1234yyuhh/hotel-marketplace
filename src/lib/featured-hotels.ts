// Soft-launch whitelist — guest browsing/booking is paused everywhere
// except these specific hotels. Any hotel id not in this list still shows
// the "Coming Soon" placeholder on its detail page, and is excluded from
// /browse and the homepage's featured stays.
export const FEATURED_HOTEL_IDS = [
  "4419b519-b212-47c9-99a3-473b84e25be4", // Shillong Home Stay
  "b2ba7c3a-47a5-47b9-86ef-4e16f2b5ba4b", // Cloud Cottage Homestay
  "5748ba88-8980-4faa-9d80-8097bcdccbb9", // D Tinsukia Address
  "f40893e8-ab9d-4bfd-8a26-42dd4edc363c", // KOHUWA HOMESTAY
];

export function isFeaturedHotel(hotelId: string): boolean {
  return FEATURED_HOTEL_IDS.includes(hotelId);
}
