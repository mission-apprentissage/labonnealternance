import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("domainesmetiers").updateOne(
    { sous_domaine: "Assainissement biologique, nucléaire, dépollution" },
    { $set: { codes_romes: ["I1503", "H1303", "K2305", "F1116", "H1225", "H2508", "I1505", "H1309"] } }
  )

  await getDbCollection("domainesmetiers").updateOne({ sous_domaine: "Nettoyage, propreté" }, { $push: { codes_romes: "K2307" } })

  await getDbCollection("domainesmetiers").updateOne({ sous_domaine: "Transport, conduite, livraison" }, { $push: { codes_romes: "N4112" } })

  await getDbCollection("domainesmetiers").updateOne({ sous_domaine: "Edition" }, { $push: { codes_romes: "E1105" } })

  await getDbCollection("domainesmetiers").updateOne({ sous_domaine: "Management, support en banque, assurance" }, { $push: { codes_romes: "C1204" } })

  await getDbCollection("domainesmetiers").updateOne({ sous_domaine: "Mécanique, carrosserie auto, moto" }, { $push: { codes_romes: "I1604" } })

  await getDbCollection("domainesmetiers").updateOne({ sous_domaine: "Management, support en banque, assurance" }, { $push: { codes_romes: "C1106" } })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
