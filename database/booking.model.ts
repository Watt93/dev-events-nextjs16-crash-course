import { Schema, model, models, Model, HydratedDocument, Types } from "mongoose";
import { Event } from "./event.model";

export interface IBooking {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingDocument = HydratedDocument<IBooking>;

// RFC 5322-lite email check: local-part@domain, no whitespace.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => EMAIL_REGEX.test(value),
        message: "Email must be a valid email address",
      },
    },
  },
  { timestamps: true }
);

// Speeds up lookups of all bookings for a given event.
BookingSchema.index({ eventId: 1 });

// Reject bookings that reference an Event that doesn't exist. Only re-checks
// when eventId changes, since existing bookings' references never mutate.
BookingSchema.pre("save", async function (this: BookingDocument) {
  if (this.isModified("eventId")) {
    const eventExists = await Event.exists({ _id: this.eventId });
    if (!eventExists) {
      throw new Error(`Event with id "${this.eventId.toString()}" does not exist`);
    }
  }
});

export const Booking: Model<IBooking> =
  (models.Booking as Model<IBooking>) || model<IBooking>("Booking", BookingSchema);
