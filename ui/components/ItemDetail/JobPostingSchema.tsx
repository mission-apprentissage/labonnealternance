// documentation :
// schema : https://schema.org/JobPosting
// cas spécifique google : https://developers.google.com/search/docs/appearance/structured-data/job-posting

export type JobPostingSchema = {
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
  datePosted: Date
  validThrough: Date
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
}
