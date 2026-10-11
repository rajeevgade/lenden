import type { Entry, EntryWithEvent, EntryWithFamily, Event, EventType, Family, Outfit } from '../domain/types';

/* Row shapes as they come out of SQLite (snake_case), plus mappers to domain objects. */

export interface FamilyRow {
  id: string;
  name: string;
  relation: string | null;
  city: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  name: string;
  type: string;
  date: string;
  host_family_id: string | null;
  venue: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntryRow {
  id: string;
  family_id: string;
  event_id: string;
  direction: string;
  kind: string;
  amount_minor: number | null;
  currency: string;
  item_description: string | null;
  photo_path: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutfitRow {
  id: string;
  event_id: string;
  person_label: string;
  photo_path: string | null;
  note: string | null;
  created_at: string;
}

export function toFamily(r: FamilyRow): Family {
  return {
    id: r.id,
    name: r.name,
    relation: r.relation,
    city: r.city,
    phone: r.phone,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toEvent(r: EventRow): Event {
  return {
    id: r.id,
    name: r.name,
    type: r.type as EventType,
    date: r.date,
    hostFamilyId: r.host_family_id,
    venue: r.venue,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toEntry(r: EntryRow): Entry {
  return {
    id: r.id,
    familyId: r.family_id,
    eventId: r.event_id,
    direction: r.direction as Entry['direction'],
    kind: r.kind as Entry['kind'],
    amountMinor: r.amount_minor,
    currency: r.currency,
    itemDescription: r.item_description,
    photoPath: r.photo_path,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toOutfit(r: OutfitRow): Outfit {
  return {
    id: r.id,
    eventId: r.event_id,
    personLabel: r.person_label,
    photoPath: r.photo_path,
    note: r.note,
    createdAt: r.created_at,
  };
}

export type EntryWithEventRow = EntryRow & {
  ev_name: string;
  ev_type: string;
  ev_date: string;
  ev_host_family_id: string | null;
};

export function toEntryWithEvent(r: EntryWithEventRow): EntryWithEvent {
  return {
    ...toEntry(r),
    event: { id: r.event_id, name: r.ev_name, type: r.ev_type as EventType, date: r.ev_date, hostFamilyId: r.ev_host_family_id },
  };
}

export type EntryWithFamilyRow = EntryRow & { fam_name: string; fam_city: string | null };

export function toEntryWithFamily(r: EntryWithFamilyRow): EntryWithFamily {
  return { ...toEntry(r), family: { id: r.family_id, name: r.fam_name, city: r.fam_city } };
}
