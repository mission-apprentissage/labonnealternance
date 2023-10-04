import { db } from "@/common/mongodb"

import { runScript } from "../../../scriptWrapper"

runScript(async () => {
  await db.collection("opcos").updateMany({ opco: "akto" }, [{ $set: { opco: "AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre" } }])
})
