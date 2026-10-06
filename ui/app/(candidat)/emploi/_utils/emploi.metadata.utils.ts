import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

type IEmploiMetadataItem = {
  title?: string | null
  company?: { name?: string | null } | null
  place?: { city?: string | null } | null
  // `Jsonify` dégrade `nafs` en `JsonValue[]` côté front : on lit le libellé prudemment plutôt que de recourir à un @ts-ignore.
  nafs?: unknown
}

const SERVICE_PUBLIC = "La bonne alternance, service public gratuit"

/**
 * Meta description des fiches /emploi/* (#4568).
 *
 * Sans description propre, la page hérite de celle du layout racine : toutes les fiches offres
 * servent alors le même texte générique à Google. On la construit à partir des données de l'offre
 * (poste, entreprise, ville), chaque élément étant omis s'il est absent.
 * Le poste est placé en tête : c'est lui qui porte la requête, et Google tronque vers 155 caractères.
 */
export function buildEmploiMetaDescription(type: LBA_ITEM_TYPE, item: IEmploiMetadataItem): string | undefined {
  const title = item.title?.trim()
  const company = item.company?.name?.trim()
  const city = item.place?.city?.trim()
  const lieu = city ? ` à ${city}` : ""

  switch (type) {
    case LBA_ITEM_TYPE.RECRUTEURS_LBA: {
      const naf = Array.isArray(item.nafs) ? item.nafs[0] : null
      const secteur = naf && typeof naf === "object" && "label" in naf && typeof naf.label === "string" ? naf.label.trim() : ""
      return `Candidature spontanée en alternance${title ? ` chez ${title}` : ""}${lieu}${secteur ? ` (${secteur})` : ""}. Entreprise susceptible de recruter : postulez via ${SERVICE_PUBLIC}.`
    }
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
      return `${title ? `${title} : offre` : "Offre"} d'alternance${company ? ` chez ${company}` : ""}${lieu}. Postulez en ligne sur ${SERVICE_PUBLIC}.`
    default:
      return undefined
  }
}
