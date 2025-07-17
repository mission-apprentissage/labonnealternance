// documentation :
// schema : https://schema.org/JobPosting
// cas spécifique google : https://developers.google.com/search/docs/appearance/structured-data/job-posting

import { ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

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
    employmentType: "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job?.company?.name,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: job?.place?.numberAndStreet ?? null,
        addressLocality: job?.place?.city ?? null,
        addressRegion: null,
        postalCode: job?.place?.zipCode ?? null,
        addressCountry: "France",
      },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: {
        "@type": "QuantitativeValue",
        minValue: 486.49,
        unitText: "MONTH",
      },
    },
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
  employmentType: "FULL_TIME"
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
      addressRegion: string
      postalCode: string
      addressCountry: string
    }
  }
  baseSalary: {
    "@type": "MonetaryAmount"
    currency: string
    value: {
      "@type": "QuantitativeValue"
      value?: number
      minValue?: number
      maxValue?: number
      unitText: string
    }
  }
}
