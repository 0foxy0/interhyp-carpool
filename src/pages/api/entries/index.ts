import { NextApiResponse, NextApiRequest } from "next";
import entries from "../../../schemas/entries";
import dbConnect from "../../../utils/mongodb";
import { Entry } from "../../../utils/types";

interface TBody {
  filter?: string;
  ownEntries?: string[];
  signins?: Entry[];
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST")
    return res.status(404).send(`Cannot ${req.method} ${req.url}`);
  const { body }: { body: TBody } = req;

  try {
    await dbConnect();
    const currentUnixTimestamp = new Date().getTime() / 1000;

    await entries
      .deleteMany()
      .where("UnixTimestamp")
      .lt(currentUnixTimestamp)
      .exec();

    const foundEntries = await entries
      .find()
      .where("UnixTimestamp")
      .gte(currentUnixTimestamp)
      .exec();

    let filteredEntries: Entry[] = foundEntries;

    if (body.filter) {
      if (body.filter === "signins")
        filteredEntries = filteredEntries.filter((filteredEntry) =>
          body.signins?.some(
            (signinEntry) => signinEntry._id === filteredEntry._id.toString()
          )
        );
      else
        filteredEntries = filteredEntries.filter(
          (entry) => entry.Location === body.filter
        );
    }

    res.send({
      entries: filteredEntries,
      onlySignins: body.filter === "signins" ? true : false,
    });
  } catch (e: any) {
    res.status(500).send({ error: e });
  }
};

export default handler;
