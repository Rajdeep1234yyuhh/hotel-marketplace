import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import type { DocumentSnapshot, Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getFirestoreDb } from "@/lib/firebase-admin";

/**
 * Firestore-backed data store. Every function here mirrors what the
 * original Prisma/JSON-file calls used to do, so call sites only ever deal
 * with plain typed objects — Firestore specifics stay in this file.
 */

export type Role = "BUYER" | "SELLER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type RoomCategory = {
  id: string;
  hotelId: string;
  name: string;
  totalRooms: number;
  pricePerNight: number;
  description: string;
  amenities: string;
  mealPlans: string;
  photos: string;
  createdAt: string;
};

export type Hotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string;
  rating: number;
  coverImage: string;
  published: boolean;
  contactEmail: string;
  contactPhone: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  latitude: number | null;
  longitude: number | null;
  ownerId: string;
  // Emails (lowercased) granted the same manage access as the owner —
  // see addHotelManager/removeHotelManager. Absent on hotels created before
  // this field existed, so always read with `?? []`.
  managerEmails: string[];
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  email: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  status: string;
  mealPlan: string;
  roomCategoryId: string | null;
  createdAt: string;
};

export type ItineraryDay = {
  id: string;
  packageId: string;
  dayNumber: number;
  title: string;
  description: string;
  createdAt: string;
};

export type TourPackage = {
  id: string;
  title: string;
  destination: string;
  description: string;
  durationDays: number;
  durationNights: number;
  pricePerPerson: number;
  coverImage: string;
  photos: string;
  inclusions: string;
  exclusions: string;
  highlights: string;
  published: boolean;
  hostedBy: string;
  contactEmail: string;
  contactPhone: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type PackageBooking = {
  id: string;
  packageId: string;
  guestId: string;
  guestName: string;
  email: string;
  travelDate: string;
  travelers: number;
  total: number;
  status: string;
  createdAt: string;
};

const usersCol = () => getFirestoreDb().collection("users");
const hotelsCol = () => getFirestoreDb().collection("hotels");
const roomCategoriesCol = () => getFirestoreDb().collection("roomCategories");
const bookingsCol = () => getFirestoreDb().collection("bookings");
const tourPackagesCol = () => getFirestoreDb().collection("tourPackages");
const itineraryDaysCol = () => getFirestoreDb().collection("itineraryDays");
const packageBookingsCol = () => getFirestoreDb().collection("packageBookings");

export function newId() {
  return randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function fromDoc<T>(doc: QueryDocumentSnapshot | DocumentSnapshot): T {
  return { id: doc.id, ...(doc.data() as object) } as T;
}

async function deleteAll(query: Query) {
  const snap = await query.get();
  for (let i = 0; i < snap.docs.length; i += 450) {
    const batch = getFirestoreDb().batch();
    snap.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function resetDb() {
  await Promise.all([
    deleteAll(bookingsCol()),
    deleteAll(roomCategoriesCol()),
    deleteAll(hotelsCol()),
    deleteAll(usersCol()),
    deleteAll(packageBookingsCol()),
    deleteAll(itineraryDaysCol()),
    deleteAll(tourPackagesCol()),
  ]);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function findUserById(id: string): Promise<User | null> {
  const doc = await usersCol().doc(id).get();
  return doc.exists ? fromDoc<User>(doc) : null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const snap = await usersCol().where("email", "==", email).limit(1).get();
  return snap.empty ? null : fromDoc<User>(snap.docs[0]);
}

export async function listUsers(): Promise<User[]> {
  const snap = await usersCol().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => fromDoc<User>(d));
}

export async function upsertUserByEmail(input: {
  name: string;
  email: string;
  role: Role;
}): Promise<User> {
  const existing = await usersCol().where("email", "==", input.email).limit(1).get();
  if (!existing.empty) {
    const ref = existing.docs[0].ref;
    await ref.update({ name: input.name, role: input.role });
    return { ...fromDoc<User>(existing.docs[0]), name: input.name, role: input.role };
  }
  const id = newId();
  const data = { name: input.name, email: input.email, role: input.role, createdAt: nowIso() };
  await usersCol().doc(id).set(data);
  return { id, ...data };
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  const ref = usersCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("User not found");
  await ref.update({ role });
  return { ...fromDoc<User>(doc), role };
}

export async function createUser(input: { name: string; email: string; role: Role }): Promise<User> {
  const id = newId();
  const data = { ...input, createdAt: nowIso() };
  await usersCol().doc(id).set(data);
  return { id, ...data };
}

export async function deleteUser(id: string): Promise<boolean> {
  const ref = usersCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
}

// ---------------------------------------------------------------------------
// Room categories
// ---------------------------------------------------------------------------

export async function findRoomCategoryById(id: string): Promise<RoomCategory | null> {
  const doc = await roomCategoriesCol().doc(id).get();
  return doc.exists ? fromDoc<RoomCategory>(doc) : null;
}

export async function roomCategoriesForHotel(hotelId: string): Promise<RoomCategory[]> {
  const snap = await roomCategoriesCol().where("hotelId", "==", hotelId).get();
  return snap.docs
    .map((d) => fromDoc<RoomCategory>(d))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ---------------------------------------------------------------------------
// Hotels
// ---------------------------------------------------------------------------

export async function findHotelById(id: string): Promise<Hotel | null> {
  const doc = await hotelsCol().doc(id).get();
  return doc.exists ? fromDoc<Hotel>(doc) : null;
}

export async function listHotels(where?: {
  ownerId?: string;
  managerEmail?: string;
  published?: boolean;
  q?: string;
}): Promise<Hotel[]> {
  let query: Query = hotelsCol();
  if (where?.ownerId) query = query.where("ownerId", "==", where.ownerId);
  if (where?.managerEmail)
    query = query.where("managerEmails", "array-contains", where.managerEmail);
  if (where?.published !== undefined) query = query.where("published", "==", where.published);

  const snap = await query.get();
  let results = snap.docs
    .map((d) => fromDoc<Hotel>(d))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (where?.q) {
    const q = where.q.toLowerCase();
    results = results.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.country.toLowerCase().includes(q)
    );
  }
  return results;
}

export async function createHotel(
  input: Omit<Hotel, "id" | "createdAt" | "updatedAt">,
  roomCategoryInputs: Omit<RoomCategory, "id" | "hotelId" | "createdAt">[] = []
): Promise<Hotel & { roomCategories: RoomCategory[] }> {
  const id = newId();
  const now = nowIso();
  const hotelData = { ...input, createdAt: now, updatedAt: now };
  await hotelsCol().doc(id).set(hotelData);

  const categories: RoomCategory[] = [];
  if (roomCategoryInputs.length > 0) {
    const batch = getFirestoreDb().batch();
    for (const c of roomCategoryInputs) {
      const categoryId = newId();
      const categoryData = { ...c, hotelId: id, createdAt: nowIso() };
      batch.set(roomCategoriesCol().doc(categoryId), categoryData);
      categories.push({ id: categoryId, ...categoryData });
    }
    await batch.commit();
  }

  return { id, ...hotelData, roomCategories: categories };
}

export async function updateHotelPublished(id: string, published: boolean): Promise<Hotel | null> {
  const ref = hotelsCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const updatedAt = nowIso();
  await ref.update({ published, updatedAt });
  return { ...fromDoc<Hotel>(doc), published, updatedAt };
}

/**
 * Full edit — updates every editable hotel field and replaces the entire
 * room-category set (deletes the old ones, inserts the new ones). Used by
 * the admin's full HotelForm-based edit page, which offers the same fields
 * as creating a listing. `published` and `ownerId` are untouched here;
 * publishing is handled separately by updateHotelPublished.
 */
export async function updateHotelFull(
  id: string,
  patch: Omit<
    Hotel,
    "id" | "createdAt" | "updatedAt" | "ownerId" | "published" | "rating" | "managerEmails"
  >,
  roomCategoryInputs: Omit<RoomCategory, "id" | "hotelId" | "createdAt">[]
): Promise<(Hotel & { roomCategories: RoomCategory[] }) | null> {
  const ref = hotelsCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const updatedAt = nowIso();
  await ref.update({ ...patch, updatedAt });

  await deleteAll(roomCategoriesCol().where("hotelId", "==", id));

  const categories: RoomCategory[] = [];
  if (roomCategoryInputs.length > 0) {
    const batch = getFirestoreDb().batch();
    for (const c of roomCategoryInputs) {
      const categoryId = newId();
      const categoryData = { ...c, hotelId: id, createdAt: nowIso() };
      batch.set(roomCategoriesCol().doc(categoryId), categoryData);
      categories.push({ id: categoryId, ...categoryData });
    }
    await batch.commit();
  }

  return { ...fromDoc<Hotel>(doc), ...patch, updatedAt, roomCategories: categories };
}

export async function deleteHotel(id: string): Promise<boolean> {
  const ref = hotelsCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await Promise.all([
    deleteAll(roomCategoriesCol().where("hotelId", "==", id)),
    deleteAll(bookingsCol().where("hotelId", "==", id)),
  ]);
  await ref.delete();
  return true;
}

/** Grant a user (by email) the same manage access as the hotel's owner. */
export async function addHotelManager(id: string, email: string): Promise<Hotel | null> {
  const ref = hotelsCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const normalized = email.trim().toLowerCase();
  await ref.update({ managerEmails: FieldValue.arrayUnion(normalized) });
  const hotel = fromDoc<Hotel>(doc);
  return {
    ...hotel,
    managerEmails: Array.from(new Set([...(hotel.managerEmails ?? []), normalized])),
  };
}

/** Revoke a manager's access to a hotel (the owner is unaffected). */
export async function removeHotelManager(id: string, email: string): Promise<Hotel | null> {
  const ref = hotelsCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const normalized = email.trim().toLowerCase();
  await ref.update({ managerEmails: FieldValue.arrayRemove(normalized) });
  const hotel = fromDoc<Hotel>(doc);
  return {
    ...hotel,
    managerEmails: (hotel.managerEmails ?? []).filter((e) => e !== normalized),
  };
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function createBooking(
  input: Omit<Booking, "id" | "createdAt" | "status">
): Promise<Booking> {
  const id = newId();
  const data = { ...input, status: "CONFIRMED", createdAt: nowIso() };
  await bookingsCol().doc(id).set(data);
  return { id, ...data };
}

export async function countBookings(where?: { hotelId?: string }): Promise<number> {
  let query: Query = bookingsCol();
  if (where?.hotelId) query = query.where("hotelId", "==", where.hotelId);
  const snap = await query.count().get();
  return snap.data().count;
}

/** All hotel bookings, newest first — for the admin bookings overview. */
export async function listBookings(): Promise<Booking[]> {
  const snap = await bookingsCol().get();
  return snap.docs
    .map((d) => fromDoc<Booking>(d))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Map of hotelId -> booking count, computed in one pass for dashboard listings. */
export async function bookingCountsByHotel(): Promise<Record<string, number>> {
  const snap = await bookingsCol().get();
  const counts: Record<string, number> = {};
  for (const doc of snap.docs) {
    const hotelId = (doc.data() as Booking).hotelId;
    counts[hotelId] = (counts[hotelId] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Itinerary days
// ---------------------------------------------------------------------------

export async function itineraryForPackage(packageId: string): Promise<ItineraryDay[]> {
  const snap = await itineraryDaysCol().where("packageId", "==", packageId).get();
  return snap.docs
    .map((d) => fromDoc<ItineraryDay>(d))
    .sort((a, b) => a.dayNumber - b.dayNumber);
}

// ---------------------------------------------------------------------------
// Tour packages
// ---------------------------------------------------------------------------

export async function findTourPackageById(id: string): Promise<TourPackage | null> {
  const doc = await tourPackagesCol().doc(id).get();
  return doc.exists ? fromDoc<TourPackage>(doc) : null;
}

export async function listTourPackages(where?: {
  ownerId?: string;
  published?: boolean;
  q?: string;
}): Promise<TourPackage[]> {
  let query: Query = tourPackagesCol();
  if (where?.ownerId) query = query.where("ownerId", "==", where.ownerId);
  if (where?.published !== undefined) query = query.where("published", "==", where.published);

  const snap = await query.get();
  let results = snap.docs
    .map((d) => fromDoc<TourPackage>(d))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (where?.q) {
    const q = where.q.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.destination.toLowerCase().includes(q)
    );
  }
  return results;
}

export async function createTourPackage(
  input: Omit<TourPackage, "id" | "createdAt" | "updatedAt">,
  itineraryInputs: Omit<ItineraryDay, "id" | "packageId" | "createdAt">[] = []
): Promise<TourPackage & { itinerary: ItineraryDay[] }> {
  const id = newId();
  const now = nowIso();
  const packageData = { ...input, createdAt: now, updatedAt: now };
  await tourPackagesCol().doc(id).set(packageData);

  const itinerary: ItineraryDay[] = [];
  if (itineraryInputs.length > 0) {
    const batch = getFirestoreDb().batch();
    for (const day of itineraryInputs) {
      const dayId = newId();
      const dayData = { ...day, packageId: id, createdAt: nowIso() };
      batch.set(itineraryDaysCol().doc(dayId), dayData);
      itinerary.push({ id: dayId, ...dayData });
    }
    await batch.commit();
  }

  return { id, ...packageData, itinerary };
}

export async function updateTourPackagePublished(
  id: string,
  published: boolean
): Promise<TourPackage | null> {
  const ref = tourPackagesCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const updatedAt = nowIso();
  await ref.update({ published, updatedAt });
  return { ...fromDoc<TourPackage>(doc), published, updatedAt };
}

export async function updateTourPackage(
  id: string,
  patch: Partial<
    Pick<TourPackage, "title" | "destination" | "description" | "coverImage" | "hostedBy">
  >
): Promise<TourPackage | null> {
  const ref = tourPackagesCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const updatedAt = nowIso();
  await ref.update({ ...patch, updatedAt });
  return { ...fromDoc<TourPackage>(doc), ...patch, updatedAt };
}

export async function deleteTourPackage(id: string): Promise<boolean> {
  const ref = tourPackagesCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await Promise.all([
    deleteAll(itineraryDaysCol().where("packageId", "==", id)),
    deleteAll(packageBookingsCol().where("packageId", "==", id)),
  ]);
  await ref.delete();
  return true;
}

// ---------------------------------------------------------------------------
// Package bookings
// ---------------------------------------------------------------------------

export async function createPackageBooking(
  input: Omit<PackageBooking, "id" | "createdAt" | "status">
): Promise<PackageBooking> {
  const id = newId();
  const data = { ...input, status: "CONFIRMED", createdAt: nowIso() };
  await packageBookingsCol().doc(id).set(data);
  return { id, ...data };
}

export async function countPackageBookings(where?: { packageId?: string }): Promise<number> {
  let query: Query = packageBookingsCol();
  if (where?.packageId) query = query.where("packageId", "==", where.packageId);
  const snap = await query.count().get();
  return snap.data().count;
}

/** All package bookings, newest first — for the admin bookings overview. */
export async function listPackageBookings(): Promise<PackageBooking[]> {
  const snap = await packageBookingsCol().get();
  return snap.docs
    .map((d) => fromDoc<PackageBooking>(d))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Map of packageId -> booking count, computed in one pass for dashboard listings. */
export async function packageBookingCountsByPackage(): Promise<Record<string, number>> {
  const snap = await packageBookingsCol().get();
  const counts: Record<string, number> = {};
  for (const doc of snap.docs) {
    const packageId = (doc.data() as PackageBooking).packageId;
    counts[packageId] = (counts[packageId] ?? 0) + 1;
  }
  return counts;
}
