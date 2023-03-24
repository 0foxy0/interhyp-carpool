import { NextApiResponse, NextApiRequest } from "next";
import entries from "../../../schemas/entries";
import { Entry } from "../../../utils/types";
import dbConnect from "../../../utils/mongodb";

interface TBody {
  entry?: Entry;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST")
    return res.status(404).send(`Cannot ${req.method} ${req.url}`);
  const { body }: { body: TBody } = req;
  const { entry } = body;

  await dbConnect();

  if (!entry) return res.status(510).send({ error: "missing entry" });

  //delete the entry in the db
  await entries.findByIdAndDelete(entry._id);

  res.send({ success: "deleted entry" });
};

export default handler;
