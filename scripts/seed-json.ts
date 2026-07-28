import { resetDb, upsertUserByEmail, createHotel } from "../src/lib/db";

function main() {
  resetDb();

  const seller = upsertUserByEmail({ name: "Aarav Mehta", email: "seller@demo.test", role: "SELLER" });
  upsertUserByEmail({ name: "Guest Traveller", email: "buyer@demo.test", role: "BUYER" });

  // Seeded directly with role ADMIN — there is no public sign-in path to this
  // role (see src/lib/session.ts); it exists so the /admin dashboard has real
  // data to query once a real auth system grants someone this role.
  upsertUserByEmail({ name: "Marketplace Admin", email: "admin@demo.test", role: "ADMIN" });

  const hotels = [
    {
      name: "The Brahmaputra Verandah",
      city: "Guwahati",
      country: "India",
      description:
        "A riverside heritage stay with teak verandahs overlooking the Brahmaputra. Mornings open onto mist on the water; evenings close with Assamese thalis served on the deck.",
      pricePerNight: 6200,
      currency: "INR",
      rating: 4.8,
      imageUrl:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
      amenities: "River view,Breakfast included,Free Wi-Fi,Airport shuttle,Spa",
      roomsTotal: 24,
      published: true,
      contactEmail: "stay@brahmaputraverandah.test",
      contactPhone: "+91 98765 43210",
      bankAccountHolder: "Aarav Mehta",
      bankAccountNumber: "000123456789",
      bankIfsc: "HDFC0001234",
      bankName: "HDFC Bank",
      latitude: 26.1445,
      longitude: 91.7362,
      mealPlans: "Room Only,Breakfast Included,Full Board",
      roomCategories: [
        {
          name: "Riverview Deluxe",
          totalRooms: 14,
          pricePerNight: 6200,
          description: "Teak-floored rooms with private verandahs facing the river.",
          photos:
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80,https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80",
        },
        {
          name: "Garden Suite",
          totalRooms: 10,
          pricePerNight: 8600,
          description: "Larger suites opening onto the courtyard garden, with a sitting area.",
          photos:
            "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900&q=80,https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=900&q=80",
        },
      ],
    },
    {
      name: "Cloudline Tea Bungalow",
      city: "Munnar",
      country: "India",
      description:
        "A restored planter's bungalow set inside a working tea estate. Walk the rows at dawn, then return to a fireplace and a pot of single-estate first flush.",
      pricePerNight: 8900,
      currency: "INR",
      rating: 4.9,
      imageUrl:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
      amenities: "Mountain view,Breakfast included,Free Wi-Fi,Guided walks,Fireplace",
      roomsTotal: 8,
      published: true,
      contactEmail: "hello@cloudlinetea.test",
      contactPhone: "+91 90000 11223",
      bankAccountHolder: "Aarav Mehta",
      bankAccountNumber: "000987654321",
      bankIfsc: "ICIC0005678",
      bankName: "ICICI Bank",
      latitude: 10.0889,
      longitude: 77.0595,
      mealPlans: "Breakfast Included,Half Board,Full Board",
      roomCategories: [
        {
          name: "Estate View Room",
          totalRooms: 5,
          pricePerNight: 8900,
          description: "Cosy rooms with a fireplace and uninterrupted views over the tea rows.",
          photos:
            "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=900&q=80,https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80",
        },
        {
          name: "Planter's Cottage",
          totalRooms: 3,
          pricePerNight: 12500,
          description: "A standalone cottage with a private veranda and outdoor seating.",
          photos: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=900&q=80",
        },
      ],
    },
    {
      name: "Marina Lighthouse Suites",
      city: "Kochi",
      country: "India",
      description:
        "Bright sea-facing suites a few steps from the Fort Kochi promenade, built around a central courtyard with a saltwater pool.",
      pricePerNight: 5400,
      currency: "INR",
      rating: 4.6,
      imageUrl:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
      amenities: "Sea view,Pool,Free Wi-Fi,Restaurant,Bicycle hire",
      roomsTotal: 32,
      published: true,
      contactEmail: "reservations@marinalighthouse.test",
      contactPhone: "+91 98111 22334",
      bankAccountHolder: "Aarav Mehta",
      bankAccountNumber: "000456789123",
      bankIfsc: "SBIN0011223",
      bankName: "State Bank of India",
      latitude: 9.9658,
      longitude: 76.2421,
      mealPlans: "Room Only,Breakfast Included",
      roomCategories: [
        {
          name: "Courtyard Room",
          totalRooms: 20,
          pricePerNight: 5400,
          description: "Compact rooms overlooking the saltwater pool and courtyard.",
          photos: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80",
        },
        {
          name: "Sea-Facing Suite",
          totalRooms: 12,
          pricePerNight: 7800,
          description: "Corner suites with wraparound windows facing the harbour.",
          photos:
            "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900&q=80,https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80",
        },
      ],
    },
    {
      name: "Dunes & Folio Desert Camp",
      city: "Jaisalmer",
      country: "India",
      description:
        "Canvas suites with hand-block interiors pitched on the Thar dunes. Camel rides at golden hour and folk music under an unobstructed night sky.",
      pricePerNight: 7300,
      currency: "INR",
      rating: 4.7,
      imageUrl:
        "https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=80",
      amenities: "Desert view,All meals,Cultural evenings,Bonfire,Stargazing",
      roomsTotal: 18,
      published: true,
      contactEmail: "camp@dunesandfolio.test",
      contactPhone: "+91 97000 55667",
      bankAccountHolder: "Aarav Mehta",
      bankAccountNumber: "000789123456",
      bankIfsc: "AXIS0009988",
      bankName: "Axis Bank",
      latitude: 26.9157,
      longitude: 70.9083,
      mealPlans: "Full Board",
      roomCategories: [
        {
          name: "Dune-View Tent",
          totalRooms: 18,
          pricePerNight: 7300,
          description: "Hand-block printed canvas suites with an attached bath, facing the dunes.",
          photos:
            "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=900&q=80,https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80",
        },
      ],
    },
  ];

  for (const { roomCategories, ...h } of hotels) {
    createHotel({ ...h, ownerId: seller.id }, roomCategories);
  }

  console.log("Seeded users,", hotels.length, "hotels, and their room categories into data/db.json");
}

main();
