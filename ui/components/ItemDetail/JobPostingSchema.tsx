// documentation :
// schema : https://schema.org/JobPosting
// cas spécifique google : https://developers.google.com/search/docs/appearance/structured-data/job-posting

import type { ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

type JobPostingSchemaProps = {
  title: string
  description: string
  id: string
  job: ILbaItemPartnerJobJson | ILbaItemLbaJobJson
}

export const JobPostingSchema = (props: JobPostingSchemaProps) => {
  return (
    <script type="application/ld+json" id="job-posting-schema">
      {JSON.stringify(buildJobPostingSchema(props))}
    </script>
  )
}

const buildJobPostingSchema = ({ title, description, id, job }: JobPostingSchemaProps): JobPostingSchema => {
  const region = job?.place?.region

  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title,
    description,
    directApply: false,

    identifier: {
      "@type": "PropertyValue",
      name: "Google",
      value: id,
    },
    datePosted: job?.job?.creationDate,
    validThrough: job?.job?.jobExpirationDate,
    // Google n'accepte que : FULL_TIME, PART_TIME, CONTRACTOR, TEMPORARY, INTERN, VOLUNTEER, PER_DIEM, OTHER.
    // L'alternance (apprentissage / professionnalisation) ne correspond à aucune de ces valeurs → "OTHER".
    // https://developers.google.com/search/docs/appearance/structured-data/job-posting#job-posting-definition
    employmentType: "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: job?.company?.name || "confidential",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: job?.place?.numberAndStreet || null,
        addressLocality: job?.place?.city || null,
        // `addressRegion` omis quand inconnu : Google interdit les données de localisation fausses et n'exige que `addressCountry`.
        ...(region ? { addressRegion: region } : {}),
        postalCode: job?.place?.zipCode || null,
        addressCountry: "France",
      },
    },
    // `baseSalary` retiré : aucune donnée de salaire fiable par offre (l'ancienne valeur 486,49 était figée pour toutes les offres).
    // Google : champ recommandé mais non requis → on l'omet plutôt que d'envoyer une valeur fausse.
    // https://developers.google.com/search/docs/appearance/structured-data/job-posting#job-posting-definition
  }
}

type JobPostingSchema = {
  "@context": "https://schema.org/"
  "@type": "JobPosting"
  title: string
  description: string
  directApply: boolean

  identifier: {
    "@type": "PropertyValue"
    name: "Google"
    value: string
  }
  datePosted: string
  validThrough: string
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACTOR" | "TEMPORARY" | "INTERN" | "VOLUNTEER" | "PER_DIEM" | "OTHER"
  hiringOrganization: {
    "@type": "Organization"
    name: string
    sameAs?: string
    logo?: string
  }
  jobLocation: {
    "@type": "Place"
    address: {
      "@type": "PostalAddress"
      streetAddress: string
      addressLocality: string
      addressRegion?: string
      postalCode: string
      addressCountry: string
    }
  }
}
