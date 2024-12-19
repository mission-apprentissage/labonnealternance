import { ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"

import { JobPostingSchema } from "../JobPostingSchema"

export const getJobPostingSchema = ({
  title,
  description,
  id,
  job,
}: {
  title: string
  description: string
  id: string
  job: ILbaItemPartnerJob | ILbaItemLbaJob
}): JobPostingSchema => {
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
    datePosted: job?.job?.jobStartDate,
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
        value: 486.49,
        unitText: "MONTH",
      },
    },
  }
}
