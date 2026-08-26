// documentation :
// Course (seul type avec résultat enrichi Google) : https://schema.org/Course et https://developers.google.com/search/docs/appearance/structured-data/course-info
// EducationalOccupationalProgram (compréhension par les moteurs et les IA) : https://schema.org/EducationalOccupationalProgram

import type { ILbaItemFormation2Json, ILbaItemRome } from "shared"
import { buildTrainingUrl } from "shared/metier/lbaitemutils"
import { JsonLdScript } from "@/components/JsonLdScript"
import { publicConfig } from "@/config.public"

type TrainingSchemaProps = {
  formation: ILbaItemFormation2Json
  /** Identifiant de la formation, déjà décodé (clé ministère éducatif). */
  id: string
}

export const TrainingSchema = ({ formation, id }: TrainingSchemaProps) => {
  const schemas = buildTrainingSchemas(formation, id)
  if (schemas.length === 0) {
    return null
  }
  return <JsonLdScript id="training-schema" schema={schemas} />
}

// Règle : tout champ sans donnée fiable est omis, jamais rempli avec une valeur inventée ou figée.
const buildTrainingSchemas = (formation: ILbaItemFormation2Json, id: string): object[] => {
  const title = formation.training?.title
  if (!title) {
    return []
  }

  const url = `${publicConfig.baseUrl}${buildTrainingUrl(id, title)}`
  const courseId = `${url}#course`
  const description = formation.training?.description || formation.training?.objectif || null
  const credential = formation.training?.rncpLabel || formation.training?.diploma || null
  const provider = buildProvider(formation)
  // `Jsonify` dégrade le type des éléments de `romes` en JsonValue : on restaure le type source,
  // structurellement identique après sérialisation (uniquement des strings nullables).
  const romes = (formation.training?.romes ?? []) as ILbaItemRome[]
  const occupationalCategories = romes.filter((rome) => rome.code).map((rome) => (rome.label ? `${rome.code} - ${rome.label}` : (rome.code as string)))

  const course = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": courseId,
    name: title,
    url,
    ...(description ? { description } : {}),
    ...(provider ? { provider } : {}),
    ...(credential ? { educationalCredentialAwarded: credential } : {}),
    // Champ requis du résultat enrichi Google : la formation en alternance est gratuite
    // pour l'alternant (financement OPCO / employeur).
    offers: {
      "@type": "Offer",
      category: "Free",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      // L'alternance combine formation en centre et travail en entreprise.
      courseMode: "Blended",
      ...(formation.place?.city
        ? {
            location: {
              "@type": "Place",
              address: buildAddress(formation.place),
            },
          }
        : {}),
    },
    inLanguage: "fr",
  }

  const program = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    name: title,
    url,
    programType: "apprenticeship",
    ...(description ? { description } : {}),
    ...(provider ? { provider } : {}),
    ...(credential ? { educationalCredentialAwarded: credential } : {}),
    ...(occupationalCategories.length > 0 ? { occupationalCategory: occupationalCategories } : {}),
    hasCourse: { "@id": courseId },
    inLanguage: "fr",
  }

  return [course, program]
}

const buildProvider = (formation: ILbaItemFormation2Json) => {
  const name = formation.company?.name
  if (!name) {
    return null
  }
  const place = formation.company?.place
  return {
    "@type": "EducationalOrganization",
    name,
    ...(place?.city ? { address: buildAddress(place) } : {}),
  }
}

// Pour les formations, la rue est portée par `place.address` (cf. transformFormationV2,
// server/src/services/formation.service.ts) — `numberAndStreet` n'y est jamais renseigné.
const buildAddress = (place: { address?: string | null; numberAndStreet?: string | null; city?: string | null; zipCode?: string | null }) => {
  const street = place.address || place.numberAndStreet
  return {
    "@type": "PostalAddress",
    ...(street ? { streetAddress: street } : {}),
    ...(place.city ? { addressLocality: place.city } : {}),
    ...(place.zipCode ? { postalCode: place.zipCode } : {}),
    addressCountry: "France",
  }
}
