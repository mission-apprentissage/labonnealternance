import config from "../../config.js";

export default function (req, res, next) {
  const application = req.get("Application");
  const apiKey = req.get("API-Key");

  if (!apiKey) {
    res.status(401).json({ error: "Missing API Key" });
  } else if (!application) {
    res.status(401).json({ error: "Missing application" });
  } else if (apiKey !== config.private[application]?.apiKey) {
    res.status(401).json({ error: "Unauthorized API Key" });
  } else {
    next();
  }
};
