import mongoose, { ConnectionStates } from "mongoose";
import config from "../config.json";

interface TConnection {
  isConnected?: ConnectionStates;
}

const connection: TConnection = {};

const dbConnect = async () => {
  if (connection.isConnected) return;

  mongoose.set("strictQuery", true);
  const db = await mongoose.connect(
    config.MONGODB_URI.replace("$PASSWORD", process.env.MONGODB_PW || "")
  );

  connection.isConnected = db.connections[0].readyState;
};

export default dbConnect;
