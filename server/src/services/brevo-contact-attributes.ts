import brevo from "@getbrevo/brevo"
import { internal } from "@hapi/boom"

import { logger } from "@/common/logger"
import config from "@/config"
import { describeBrevoError } from "@/services/brevo.service"

type BrevoContactAttributeType = "text" | "date" | "float" | "boolean"

// Attributs de contact que les imports CSV remplissent. L'import Brevo ignore sans erreur toute colonne
// sans attribut correspondant sur le compte : chaque en-tête de colonne doit figurer ici (cf. BrevoContactColumn).
export const BREVO_CONTACT_ATTRIBUTES = {
  PRENOM: "text",
  NOM: "text",
  USER_ORIGIN: "text",
  ROLE_AUTHORIZED_TYPE: "text",
  ROLE_CREATEDAT: "date",
  LAST_ACTION_DATE: "date",
  DATE_DERNIERE_OFFRE: "date",
  ENTREPRISE_ENSEIGNE: "text",
  ENTREPRISE_RAISON_SOCIALE: "text",
  ENTREPRISE_SIRET: "text",
  CFA_ENSEIGNE: "text",
  CFA_RAISON_SOCIALE: "text",
  CFA_SIRET: "text",
  JOB_COUNT: "float",
  EFFECTIFS: "text",
  RAISON_SOCIALE: "text",
  METIER: "text",
  LIEN_RECHERCHE: "text",
  PRENOM_CANDIDAT: "text",
  NOM_CANDIDAT: "text",
  REPONSE_EMPLOYEUR: "text",
  // Créé en text sur le compte. Brevo ne permet pas de changer le type d'un attribut sans le supprimer, valeurs comprises.
  DATE_REPONSE_EMPLOYEUR: "text",
} as const satisfies Record<string, BrevoContactAttributeType>

export type BrevoContactAttributeName = keyof typeof BREVO_CONTACT_ATTRIBUTES

// EMAIL est l'identifiant natif du contact, pas un attribut.
export type BrevoContactColumn = { key: string; header: "EMAIL" | BrevoContactAttributeName }

type BrevoAccountAttribute = { name: string; category: string; type?: string }

export type BrevoContactAttributesDiff = {
  missing: { name: BrevoContactAttributeName; type: BrevoContactAttributeType }[]
  mismatches: { name: BrevoContactAttributeName; expected: string; actual: string }[]
}

export const diffBrevoContactAttributes = (accountAttributes: BrevoAccountAttribute[]): BrevoContactAttributesDiff => {
  const byName = new Map(accountAttributes.map((attribute) => [attribute.name, attribute]))
  const diff: BrevoContactAttributesDiff = { missing: [], mismatches: [] }

  for (const [name, type] of Object.entries(BREVO_CONTACT_ATTRIBUTES) as [BrevoContactAttributeName, BrevoContactAttributeType][]) {
    const attribute = byName.get(name)
    if (!attribute) {
      diff.missing.push({ name, type })
    } else if (attribute.category !== "normal" || attribute.type !== type) {
      diff.mismatches.push({ name, expected: `normal/${type}`, actual: `${attribute.category}/${attribute.type ?? "-"}` })
    }
  }

  return diff
}

const SDK_ATTRIBUTE_TYPES: Record<BrevoContactAttributeType, brevo.CreateAttribute.TypeEnum> = {
  text: brevo.CreateAttribute.TypeEnum.Text,
  date: brevo.CreateAttribute.TypeEnum.Date,
  float: brevo.CreateAttribute.TypeEnum.Float,
  boolean: brevo.CreateAttribute.TypeEnum.Boolean,
}

/**
 * Compare les attributs du compte Brevo à BREVO_CONTACT_ATTRIBUTES et, avec `apply`, crée ceux qui manquent.
 * Un attribut existant au mauvais type n'est jamais modifié. Échoue tant qu'un écart subsiste.
 */
export const syncBrevoContactAttributes = async (payload: { apply?: boolean } = {}): Promise<BrevoContactAttributesDiff> => {
  const apply = payload.apply === true
  const clientBrevo = new brevo.ContactsApi()
  clientBrevo.setApiKey(brevo.ContactsApiApiKeys.apiKey, config.brevo.apiKey)

  const { body } = await clientBrevo.getAttributes()
  const diff = diffBrevoContactAttributes(
    body.attributes.map(({ name, category, type }) => ({ name, category: String(category), type: type === undefined ? undefined : String(type) }))
  )

  logger.info(diff, `brevo: ${diff.missing.length} attribut(s) manquant(s), ${diff.mismatches.length} au mauvais type`)

  const failures: { name: string; status: number | undefined; message: string }[] = []
  if (apply) {
    for (const { name, type } of diff.missing) {
      try {
        await clientBrevo.createAttribute("normal", name, { type: SDK_ATTRIBUTE_TYPES[type] })
        logger.info(`brevo: attribut ${name} (${type}) créé`)
      } catch (error) {
        const { status, brevoMessage, message } = describeBrevoError(error)
        failures.push({ name, status, message: brevoMessage ?? message })
      }
    }
  }

  const unresolved = apply ? failures.map(({ name }) => name) : diff.missing.map(({ name }) => name)
  if (unresolved.length > 0 || diff.mismatches.length > 0) {
    throw internal("brevo: attributs de contact non conformes", { unresolved, mismatches: diff.mismatches, failures })
  }

  return diff
}
