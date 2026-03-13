const BASE_URL = "https://labonnealternance.apprentissage.beta.gouv.fr"

type BreadcrumbItem = {
  name: string
  url: string
}

type SchemaOrgProps = {
  type: "WebSite" | "WebPage" | "Article" | "FAQPage"
  title: string
  description: string
  url: string
  breadcrumbs: BreadcrumbItem[]
  datePublished?: string
  dateModified?: string
  faqItems?: { question: string; answer: string }[]
}

export const SchemaOrg = ({ type, title, description, url, breadcrumbs, datePublished, dateModified, faqItems }: SchemaOrgProps) => {
  const schemas: object[] = []

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  }
  schemas.push(breadcrumbSchema)

  if (type === "WebSite") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "La bonne alternance",
      url: BASE_URL,
      description,
      publisher: {
        "@type": "GovernmentOrganization",
        name: "Délégation générale à l'emploi et à la formation professionnelle (DGEFP)",
        url: "https://travail-emploi.gouv.fr",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/recherche?job={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    })
  }

  if (type === "WebPage") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: `${BASE_URL}${url}`,
      isPartOf: {
        "@type": "WebSite",
        name: "La bonne alternance",
        url: BASE_URL,
      },
      publisher: {
        "@type": "GovernmentOrganization",
        name: "Délégation générale à l'emploi et à la formation professionnelle (DGEFP)",
      },
    })
  }

  if (type === "Article") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      url: `${BASE_URL}${url}`,
      ...(datePublished && { datePublished }),
      ...(dateModified && { dateModified }),
      author: {
        "@type": "GovernmentOrganization",
        name: "La bonne alternance",
        url: BASE_URL,
      },
      publisher: {
        "@type": "GovernmentOrganization",
        name: "Délégation générale à l'emploi et à la formation professionnelle (DGEFP)",
        url: "https://travail-emploi.gouv.fr",
      },
      isPartOf: {
        "@type": "WebSite",
        name: "La bonne alternance",
        url: BASE_URL,
      },
      inLanguage: "fr",
    })
  }

  if (type === "FAQPage" && faqItems?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: title,
      description,
      url: `${BASE_URL}${url}`,
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    })
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
    </>
  )
}
