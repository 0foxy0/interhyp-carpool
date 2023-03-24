import mongoose, { model, Schema } from "mongoose";

const entriesSchema = new Schema({
  Name: String,
  WindowsUsername: String,
  Location: String,
  Route: String,
  Date: String,
  MaxParticipants: Number,
  Participants: Array,
  UnixTimestamp: Number,
});

export default mongoose.models.entries || model("entries", entriesSchema);
