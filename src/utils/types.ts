export interface Participant {
  name: string;
  windowsUsername: string;
}

export interface Entry {
  _id: string;
  Name: string; // Firstname Lastname
  WindowsUsername: string;
  Location: string;
  Route: string; // Google Maps Link
  Date: string; // Date - Time | 02.07.2023 - 16:00Uhr
  MaxParticipants: number;
  Participants: Participant[]; // [{ name: "Klaus Maus", windowsUsername: "kmaus" }, { name: "Hans Jans", windowsUsername: "hjans" }]
  UnixTimestamp: number;
  SigninName?: string; // Firstname Lastname
}

export interface Signin {
  _id: string;
  SigninName: string;
}

export interface PostReqBody {
  participant?: string;
  entry?: Entry;
}
