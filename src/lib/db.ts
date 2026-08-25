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

/**
 * A per-date override of a room category's rate/availability, used by the
 * Rates & Inventories calendar. `id` is `${roomCategoryId}_${date}`. Any
 * field left `null` falls back to the room category's base value (e.g. a
 * date with no override at all just uses pricePerNight/totalRooms).
 */
export type RateOverride = {
  id: string;
  hotelId: string;
  roomCategoryId: string;
  date: string;
  rate: number | null;
  availableRooms: number | null;
  closed: boolean;
  minStay: number | null;
  maxStay: number | null;
  updatedAt: string;
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
  reference: string;
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
  // Emails (lowercased) granted the same manage access as the owner —
  // see addPackageManager/removePackageManager. Absent on packages created
  // before this field existed, so always read with `?? []`.
  managerEmails: string[];
  createdAt: string;
  updatedAt: string;
};

export type PackageBooking = {
  id: string;
  reference: string;
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
const rateOverridesCol = () => getFirestoreDb().collection("rateOverrides");
const bookingsCol = () => getFirestoreDb().collection("bookings");
const tourPackagesCol = () => getFirestoreDb().collection("tourPackages");
const itineraryDaysCol = () => getFirestoreDb().collection("itineraryDays");
const packageBookingsCol = () => getFirestoreDb().collection("packageBookings");

export function newId() {
  return randomUUID();
}

/** Short, human-readable booking reference — e.g. "HB-7F3A9C2D". */
function generateBookingReference(prefix: string): string {
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
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
// Rate overrides (Rates & Inventories calendar)
// ---------------------------------------------------------------------------

export async function listRateOverridesForHotel(hotelId: string): Promise<RateOverride[]> {
  const snap = await rateOverridesCol().where("hotelId", "==", hotelId).get();
  return snap.docs.map((d) => fromDoc<RateOverride>(d));
}

export type RateOverrideInput = {
  roomCategoryId: string;
  date: string;
  rate: number | null;
  availableRooms: number | null;
  closed: boolean;
  minStay: number | null;
  maxStay: number | null;
};

/** Batch upsert — one doc per (roomCategoryId, date), id-keyed so re-saving the same cell overwrites it. */
export async function upsertRateOverrides(
  hotelId: string,
  entries: RateOverrideInput[]
): Promise<void> {
  const updatedAt = nowIso();
  for (let i = 0; i < entries.length; i += 450) {
    const batch = getFirestoreDb().batch();
    entries.slice(i, i + 450).forEach((e) => {
      const id = `${e.roomCategoryId}_${e.date}`;
      batch.set(rateOverridesCol().doc(id), { ...e, hotelId, updatedAt }, { merge: true });
    });
    await batch.commit();
  }
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
    deleteAll(rateOverridesCol().where("hotelId", "==", id)),
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
  input: Omit<Booking, "id" | "createdAt" | "status" | "reference">
): Promise<Booking> {
  const id = newId();
  const data = {
    ...input,
    status: "CONFIRMED",
    reference: generateBookingReference("HB"),
    createdAt: nowIso(),
  };
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

export async function findBookingById(id: string): Promise<Booking | null> {
  const doc = await bookingsCol().doc(id).get();
  return doc.exists ? fromDoc<Booking>(doc) : null;
}

export async function updateBookingStatus(
  id: string,
  status: "CONFIRMED" | "CANCELLED"
): Promise<Booking | null> {
  const ref = bookingsCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update({ status });
  return { ...fromDoc<Booking>(doc), status };
}

/**
 * References are shown to guests/hosts as the single lookup id for a stay,
 * so they must be unique across both hotel and package bookings, not just
 * within one collection.
 */
export async function isBookingReferenceTaken(
  reference: string,
  exclude?: { bookingId?: string; packageBookingId?: string }
): Promise<boolean> {
  const normalized = reference.trim().toUpperCase();
  const [bookingSnap, packageSnap] = await Promise.all([
    bookingsCol().where("reference", "==", normalized).get(),
    packageBookingsCol().where("reference", "==", normalized).get(),
  ]);
  const bookingTaken = bookingSnap.docs.some((d) => d.id !== exclude?.bookingId);
  const packageTaken = packageSnap.docs.some((d) => d.id !== exclude?.packageBookingId);
  return bookingTaken || packageTaken;
}

export async function updateBookingReference(id: string, reference: string): Promise<Booking | null> {
  const ref = bookingsCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const normalized = reference.trim().toUpperCase();
  await ref.update({ reference: normalized });
  return { ...fromDoc<Booking>(doc), reference: normalized };
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
  managerEmail?: string;
  published?: boolean;
  q?: string;
}): Promise<TourPackage[]> {
  let query: Query = tourPackagesCol();
  if (where?.ownerId) query = query.where("ownerId", "==", where.ownerId);
  if (where?.managerEmail)
    query = query.where("managerEmails", "array-contains", where.managerEmail);
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

/**
 * Full edit — updates every editable package field and replaces the entire
 * itinerary (deletes the old days, inserts the new ones). Used by the
 * admin's and host's shared TourPackageForm-based edit page, which offers
 * the same fields as creating a listing. `published` is untouched here;
 * publishing is handled separately by updateTourPackagePublished.
 */
export async function updateTourPackageFull(
  id: string,
  patch: Omit<
    TourPackage,
    "id" | "createdAt" | "updatedAt" | "ownerId" | "published" | "managerEmails"
  >,
  itineraryInputs: Omit<ItineraryDay, "id" | "packageId" | "createdAt">[]
): Promise<(TourPackage & { itinerary: ItineraryDay[] }) | null> {
  const ref = tourPackagesCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const updatedAt = nowIso();
  await ref.update({ ...patch, updatedAt });

  await deleteAll(itineraryDaysCol().where("packageId", "==", id));

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

  return { ...fromDoc<TourPackage>(doc), ...patch, updatedAt, itinerary };
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

/** Grant a user (by email) the same manage access as the package's owner. */
export async function addPackageManager(id: string, email: string): Promise<TourPackage | null> {
  const ref = tourPackagesCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const normalized = email.trim().toLowerCase();
  await ref.update({ managerEmails: FieldValue.arrayUnion(normalized) });
  const tourPackage = fromDoc<TourPackage>(doc);
  return {
    ...tourPackage,
    managerEmails: Array.from(new Set([...(tourPackage.managerEmails ?? []), normalized])),
  };
}

/** Revoke a manager's access to a package (the owner is unaffected). */
export async function removePackageManager(
  id: string,
  email: string
): Promise<TourPackage | null> {
  const ref = tourPackagesCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const normalized = email.trim().toLowerCase();
  await ref.update({ managerEmails: FieldValue.arrayRemove(normalized) });
  const tourPackage = fromDoc<TourPackage>(doc);
  return {
    ...tourPackage,
    managerEmails: (tourPackage.managerEmails ?? []).filter((e) => e !== normalized),
  };
}

// ---------------------------------------------------------------------------
// Package bookings
// ---------------------------------------------------------------------------

export async function createPackageBooking(
  input: Omit<PackageBooking, "id" | "createdAt" | "status" | "reference">
): Promise<PackageBooking> {
  const id = newId();
  const data = {
    ...input,
    status: "CONFIRMED",
    reference: generateBookingReference("TP"),
    createdAt: nowIso(),
  };
  await packageBookingsCol().doc(id).set(data);
  return { id, ...data };
}

export async function findPackageBookingById(id: string): Promise<PackageBooking | null> {
  const doc = await packageBookingsCol().doc(id).get();
  return doc.exists ? fromDoc<PackageBooking>(doc) : null;
}

export async function updatePackageBookingReference(
  id: string,
  reference: string
): Promise<PackageBooking | null> {
  const ref = packageBookingsCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const normalized = reference.trim().toUpperCase();
  await ref.update({ reference: normalized });
  return { ...fromDoc<PackageBooking>(doc), reference: normalized };
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

/**
 * One-off backfill for bookings created before the reference field existed.
 * Safe to run more than once — only touches docs that don't already have one.
 */
export async function backfillBookingReferences(): Promise<{
  bookings: number;
  packageBookings: number;
}> {
  const [bookingsSnap, packageBookingsSnap] = await Promise.all([
    bookingsCol().get(),
    packageBookingsCol().get(),
  ]);

  const missingBookings = bookingsSnap.docs.filter((d) => !(d.data() as Booking).reference);
  const missingPackageBookings = packageBookingsSnap.docs.filter(
    (d) => !(d.data() as PackageBooking).reference
  );

  for (let i = 0; i < missingBookings.length; i += 450) {
    const batch = getFirestoreDb().batch();
    missingBookings
      .slice(i, i + 450)
      .forEach((d) => batch.update(d.ref, { reference: generateBookingReference("HB") }));
    await batch.commit();
  }

  for (let i = 0; i < missingPackageBookings.length; i += 450) {
    const batch = getFirestoreDb().batch();
    missingPackageBookings
      .slice(i, i + 450)
      .forEach((d) => batch.update(d.ref, { reference: generateBookingReference("TP") }));
    await batch.commit();
  }

  return { bookings: missingBookings.length, packageBookings: missingPackageBookings.length };
}
