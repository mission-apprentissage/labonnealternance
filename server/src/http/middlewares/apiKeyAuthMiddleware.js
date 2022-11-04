import { Credential } from "../../common/model/index.js";

export default async function (req, res, next) {
  const apiKey = req.get("API-Key");
  const exist = await Credential.exists({ apiKey, actif: true });

  if (!exist) {
    res.status(401).json({ error: "Unauthorized" });
  } else {
    next();
  }
}
