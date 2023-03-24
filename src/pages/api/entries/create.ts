import { NextApiResponse, NextApiRequest } from "next";
import entries from "../../../schemas/entries";
import { addZeroToTime } from "../../../utils/functions";
import dbConnect from "../../../utils/mongodb";

interface TBody {
  name: string;
  windowsUsername: string;
  location: string;
  route: string;
  date: string;
  maxParticipants: number;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST")
    return res.status(404).send(`Cannot ${req.method} ${req.url}`);
  const { body }: { body: TBody } = req;

  try {
    await dbConnect();
    const date = new Date(body.date);

    //convert the time to the string like in the mock data
    const dd = addZeroToTime(date.getDate());
    const mm = addZeroToTime(date.getMonth() + 1);
    const yyyy = date.getFullYear();
    const hr = addZeroToTime(date.getHours());
    const min = addZeroToTime(date.getMinutes());

    const newDateString = `${dd}.${mm}.${yyyy} - ${hr}:${min}Uhr`;

    //get unix timestamp
    const unixTimestamp = date.getTime() / 1000;

    //save the new Entry in the db
    const createdEntry = await entries.create({
      Name: body.name,
      WindowsUsername: body.windowsUsername,
      Location: body.location,
      Route: body.route,
      Date: newDateString,
      MaxParticipants: body.maxParticipants,
      Participants: [],
      UnixTimestamp: unixTimestamp,
    });

    res.send({ savedEntry: createdEntry });
  } catch (e: any) {
    res.status(500).send({ error: e });
  }
};

export default handler;
