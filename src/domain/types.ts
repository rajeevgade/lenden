export type ID = string;

export type EventType =
  | 'wedding'
  | 'engagement'
  | 'housewarming'
  | 'naming'
  | 'birthday'
  | 'puja'
  | 'retirement'
  | 'funeral'
  | 'other';

export const EVENT_TYPES: EventType[] = [
  'wedding',
  'engagement',
  'housewarming',
  'naming',
  'birthday',
  'puja',
  'retirement',
  'funeral',
  'other',
];

export type Direction = 'gave' | 'received';
export type EntryKind = 'cash' | 'item';

export interface Family {
  id: ID;
  name: string;
  relation: string | null;
  city: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: ID;
  name: string;
  type: EventType;
  /** ISO date YYYY-MM-DD, local calendar date of the function. */
  date: string;
  /** null means it is our own event (we are the host). */
  hostFamilyId: ID | null;
  venue: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Entry {
  id: ID;
  familyId: ID;
  eventId: ID;
  direction: Direction;
  kind: EntryKind;
  /** Integer minor units (paise/cents). For items this is the estimated value, may be null. */
  amountMinor: number | null;
  /** ISO 4217 code. */
  currency: string;
  itemDescription: string | null;
  photoPath: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Outfit {
  id: ID;
  eventId: ID;
  personLabel: string;
  photoPath: string | null;
  note: string | null;
  createdAt: string;
}

/** An entry joined with the event it belongs to, used by ledgers and suggestions. */
export interface EntryWithEvent extends Entry {
  event: Pick<Event, 'id' | 'name' | 'type' | 'date' | 'hostFamilyId'>;
}

export interface EntryWithFamily extends Entry {
  family: Pick<Family, 'id' | 'name' | 'city'>;
}

export interface Settings {
  defaultCurrency: string;
  householdName: string;
  locale: string;
}
