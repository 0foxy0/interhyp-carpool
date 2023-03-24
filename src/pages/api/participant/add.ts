import { NextApiResponse, NextApiRequest } from "next";
import entries from "../../../schemas/entries";
import { checkParticipantBody } from "../../../utils/functions";
import dbConnect from "../../../utils/mongodb";
import { Entry, Participant } from "../../../utils/types";

interface TBody {
  entry: Entry;
  participant: Participant;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST")
    return res.status(404).send(`Cannot ${req.method} ${req.url}`);
  if (!checkParticipantBody(req, res)) return;
  const { body }: { body: TBody } = req;

  try {
    await dbConnect();

    const entry: Entry | null = await entries.findById(body.entry._id);
    if (!entry) return res.status(510).send({ error: "entry not found" });
    if (entry.Participants.length >= entry.MaxParticipants)
      return res.send({
        error: "this entry reached the max number of participants",
      });

    const newParticipants = entry?.Participants.concat([body.participant]);

    const updatedEntry = await entries.findOneAndUpdate(
      { _id: body.entry._id },
      { Participants: newParticipants },
      { new: true }
    );

    res.send({ savedEntry: updatedEntry });
  } catch (e: any) {
    res.send({ error: e });
  }
};

export default handler;
