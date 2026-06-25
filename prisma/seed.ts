import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Wipe in dependency order so the seed is idempotent.
  await prisma.booking.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.user.deleteMany();

  const seller = await prisma.user.create({
    data: { name: "Aarav Mehta", email: "seller@demo.test", role: "SELLER" },
  });

  await prisma.user.create({
    data: { name: "Guest Traveller", email: "buyer@demo.test", role: "BUYER" },
  });

  const hotels = [
    {
      name: "The Brahmaputra Verandah",
      city: "Guwahati",
      country: "India",
      description:
        "A riverside heritage stay with teak verandahs overlooking the Brahmaputra. Mornings open onto mist on the water; evenings close with Assamese thalis served on the deck.",
      pricePerNight: 6200,
      rating: 4.8,
      imageUrl:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
      amenities: "River view,Breakfast included,Free Wi-Fi,Airport shuttle,Spa",
      roomsTotal: 24,
    },
    {
      name: "Cloudline Tea Bungalow",
      city: "Munnar",
      country: "India",
      description:
        "A restored planter's bungalow set inside a working tea estate. Walk the rows at dawn, then return to a fireplace and a pot of single-estate first flush.",
      pricePerNight: 8900,
      rating: 4.9,
      imageUrl:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
      amenities: "Mountain view,Breakfast included,Free Wi-Fi,Guided walks,Fireplace",
      roomsTotal: 8,
    },
    {
      name: "Marina Lighthouse Suites",
      city: "Kochi",
      country: "India",
      description:
        "Bright sea-facing suites a few steps from the Fort Kochi promenade, built around a central courtyard with a saltwater pool.",
      pricePerNight: 5400,
      rating: 4.6,
      imageUrl:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
      amenities: "Sea view,Pool,Free Wi-Fi,Restaurant,Bicycle hire",
      roomsTotal: 32,
    },
    {
      name: "Dunes & Folio Desert Camp",
      city: "Jaisalmer",
      country: "India",
      description:
        "Canvas suites with hand-block interiors pitched on the Thar dunes. Camel rides at golden hour and folk music under an unobstructed night sky.",
      pricePerNight: 7300,
      rating: 4.7,
      imageUrl:
        "https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=80",
      amenities: "Desert view,All meals,Cultural evenings,Bonfire,Stargazing",
      roomsTotal: 18,
    },
  ];

  for (const h of hotels) {
    await prisma.hotel.create({ data: { ...h, ownerId: seller.id } });
  }

  console.log("Seeded users and", hotels.length, "hotels.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
