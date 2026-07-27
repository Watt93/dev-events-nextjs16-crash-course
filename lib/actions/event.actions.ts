'use server';
import { Event } from "@/database";
import connectToDatabase from "../mongodb";

export const getSimilarEventsBySlug = async (slug: string)=> {
    try{
        await connectToDatabase();

        const event = await Event.findOne({ slug });
        if (!event) return [];

        const similarEvents = await Event.find({ _id: { $ne: event._id }, tags: { $in: event.tags } });
        return similarEvents;

    } catch (error) {
        return [];
    }
}