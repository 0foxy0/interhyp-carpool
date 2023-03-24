import { NextApiRequest, NextApiResponse } from "next";
import { PostReqBody } from "./types";

export const checkParticipantBody = (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { body }: { body: PostReqBody } = req;
  console.log(body.participant, body.entry);
  if (!body?.participant || !body?.entry) {
    res.status(510).json({ error: "Missing Participant or Entry" });
    return false;
  }
  return true;
};

export const addZeroToTime = (time: number) => {
  return time < 10 ? `0${time}` : time;
};
