import { Schema, model, models, Model, HydratedDocument } from "mongoose";

export interface IEvent {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type EventDocument = HydratedDocument<IEvent>;

// Shared shape for required, non-empty, trimmed string fields.
function requiredString(field: string) {
  return {
    type: String,
    required: [true, `${field} is required`] as [boolean, string],
    trim: true,
    validate: {
      validator: (value: string) => value.trim().length > 0,
      message: `${field} must not be empty`,
    },
  };
}

// Shared shape for required, non-empty arrays of non-empty strings.
function requiredStringArray(field: string) {
  return {
    type: [String],
    required: [true, `${field} is required`] as [boolean, string],
    validate: {
      validator: (value: string[]) =>
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((item) => typeof item === "string" && item.trim().length > 0),
      message: `${field} must contain at least one non-empty item`,
    },
  };
}

const TIME_24H_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const TIME_12H_REGEX = /^(0?[1-9]|1[0-2]):([0-5]\d)\s?([AP]M)$/i;

// Converts a URL-unsafe title into a lowercase, hyphenated slug.
function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Normalizes "14:30", "2:30 PM" and similar inputs to a strict 24-hour "HH:mm" string.
function normalizeTime(value: string): string {
  const trimmed = value.trim();

  const match24 = trimmed.match(TIME_24H_REGEX);
  if (match24) {
    const [, hours, minutes] = match24;
    return `${hours.padStart(2, "0")}:${minutes}`;
  }

  const match12 = trimmed.match(TIME_12H_REGEX);
  if (match12) {
    const [, hoursRaw, minutes, meridiem] = match12;
    let hours = parseInt(hoursRaw, 10);
    const isPM = meridiem.toUpperCase() === "PM";
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  throw new Error(`Invalid time value: "${value}". Expected formats like "14:30" or "2:30 PM".`);
}

const EventSchema = new Schema<IEvent>(
  {
    title: requiredString("Title"),
    // Not marked `required`: it is derived from `title` in the pre-save hook,
    // which runs after schema validation, so a required check here would
    // always fail on document creation.
    slug: {
      type: String,
      unique: true,
    },
    description: requiredString("Description"),
    overview: requiredString("Overview"),
    image: requiredString("Image"),
    venue: requiredString("Venue"),
    location: requiredString("Location"),
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
    },
    mode: requiredString("Mode"),
    audience: requiredString("Audience"),
    agenda: requiredStringArray("Agenda"),
    organizer: requiredString("Organizer"),
    tags: requiredStringArray("Tags"),
  },
  { timestamps: true }
);

// Generate the slug (only when the title changes) and normalize date/time
// formatting immediately before the document is persisted.
EventSchema.pre("save", function (this: EventDocument) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title);
  }

  const parsedDate = new Date(this.date);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date value: "${this.date}"`);
  }
  this.date = parsedDate.toISOString().split("T")[0];

  this.time = normalizeTime(this.time);
});

export const Event: Model<IEvent> =
  (models.Event as Model<IEvent>) || model<IEvent>("Event", EventSchema);
