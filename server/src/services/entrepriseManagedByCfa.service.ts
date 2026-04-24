import { ObjectId } from "mongodb"
import type { IEntrepriseManagedByCfa } from "shared"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export async function getEntrepriseManagedByCfa(entrepriseSiret: string, cfaSiret: string): Promise<IEntrepriseManagedByCfa | null> {
  const entreprise = await getDbCollection("entreprises").findOne({ siret: entrepriseSiret })
  if (!entreprise) {
    return null
  }
  const cfa = await getDbCollection("cfas").findOne({ siret: cfaSiret })
  if (!cfa) {
    return null
  }
  const managedEntreprise = await getDbCollection("entreprise_managed_by_cfa").findOne({ entreprise_id: entreprise._id, cfa_id: cfa._id })
  return managedEntreprise
}

export async function isEntrepriseManagedByCfa(entrepriseSiret: string, cfaSiret: string): Promise<boolean> {
  const managedEntreprise = await getEntrepriseManagedByCfa(entrepriseSiret, cfaSiret)
  return Boolean(managedEntreprise)
}

export async function createEntrepriseManagedByCfa({
  entrepriseSiret,
  cfaSiret,
  origin,
  ...contactFields
}: { entrepriseSiret: string; cfaSiret: string } & Pick<IEntrepriseManagedByCfa, "email" | "phone" | "first_name" | "last_name" | "origin">): Promise<IEntrepriseManagedByCfa> {
  const entreprise = await getDbCollection("entreprises").findOne({ siret: entrepriseSiret })
  if (!entreprise) {
    throw new Error(`inattendu: entreprise avec siret=${entrepriseSiret} introuvable`)
  }
  const cfa = await getDbCollection("cfas").findOne({ siret: cfaSiret })
  if (!cfa) {
    throw new Error(`inattendu: cfa avec siret=${cfaSiret} introuvable`)
  }
  const now = new Date()
  const entrepriseManagedByCfa: IEntrepriseManagedByCfa = {
    ...contactFields,
    origin,
    entreprise_id: entreprise._id,
    cfa_id: cfa._id,
    _id: new ObjectId(),
    createdAt: now,
    updatedAt: now,
  }
  await getDbCollection("entreprise_managed_by_cfa").insertOne(entrepriseManagedByCfa)
  return entrepriseManagedByCfa
}
