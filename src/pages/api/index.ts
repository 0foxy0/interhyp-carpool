import { NextApiResponse, NextApiRequest } from "next";

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).send({ status: "online" });
};

export default handler;
