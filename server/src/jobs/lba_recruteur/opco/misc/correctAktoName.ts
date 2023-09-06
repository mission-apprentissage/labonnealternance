import { runScript } from "../../../scriptWrapper"

runScript(async ({ db }) => {
  await db.collection("opcos").updateMany({ opco: "akto" }, [{ $set: { opco: "AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre" } }])
})
