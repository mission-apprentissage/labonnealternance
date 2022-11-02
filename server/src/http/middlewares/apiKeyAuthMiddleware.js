import { Credential } from "common/model";

export default function (req, res, next) {
  const apiKey = req.get("API-Key");
  const exist = await Credential.exists({ apiKey, actif: true });

  if (!exist) {
    res.status(401).json({ error: "Unauthorized" });
  } else {
    next();
  }
}
