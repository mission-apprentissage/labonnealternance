import { JsonLdScript } from "@/components/JsonLdScript"
import { publicConfig } from "@/config.public"

const BASE_URL = "https://labonnealternance.apprentissage.beta.gouv.fr"
const ORGANIZATION_ID = `${BASE_URL}/#organization`

type BreadcrumbItem = {
  name: string
  url: string
}

type ItemListEntry = {
  name: string
  url: string
}

type SchemaOrgProps = {
  type: "WebSite" | "WebPage" | "CollectionPage" | "Article" | "FAQPage" | "ItemList" | "Course"
  title: string
  description: string
  url: string
  breadcrumbs: BreadcrumbItem[]
  datePublished?: string
  dateModified?: string
  faqItems?: { question: string; answer: string }[]
  keywords?: string[]
  articleSection?: string
  itemList?: ItemListEntry[]
  courseCredential?: string
  courseDuration?: string
  omitBreadcrumb?: boolean
}

export const SchemaOrg = ({
  type,
  title,
  description,
  url,
  breadcrumbs,
  datePublished,
  dateModified,
  faqItems,
  keywords,
  articleSection,
  itemList,
  courseCredential,
  courseDuration,
  omitBreadcrumb,
}: SchemaOrgProps) => {
  const schemas: object[] = []

  if (!omitBreadcrumb) {
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
  }

  if (type === "WebSite") {
    // Nœud organisation autonome décrivant l'entité « La bonne alternance » elle-même :
    // c'est lui que les knowledge graphs des moteurs et les IA utilisent pour identifier le service.
    // `sameAs` ne référence que des pages officielles vérifiées de l'entité.
    schemas.push({
      "@context": "https://schema.org",
      "@type": "GovernmentOrganization",
      "@id": ORGANIZATION_ID,
      name: "La bonne alternance",
      url: BASE_URL,
      description,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/images/logo_LBA.svg`,
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: publicConfig.publicEmail,
        contactType: "customer support",
        availableLanguage: "fr",
      },
      parentOrganization: {
        "@type": "GovernmentOrganization",
        name: "Délégation générale à l'emploi et à la formation professionnelle (DGEFP)",
        url: "https://travail-emploi.gouv.fr",
      },
      sameAs: ["https://beta.gouv.fr/startups/la-bonne-alternance.html", "https://github.com/mission-apprentissage/labonnealternance"],
    })
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "La bonne alternance",
      url: BASE_URL,
      description,
      publisher: {
        "@id": ORGANIZATION_ID,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/recherche?q={search_term_string}`,
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

  if (type === "CollectionPage") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
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
        url: "https://travail-emploi.gouv.fr",
      },
      inLanguage: "fr",
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
      ...(keywords && keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
      ...(articleSection ? { articleSection } : {}),
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

  if (type === "ItemList" && itemList?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: title,
      description,
      url: `${BASE_URL}${url}`,
      numberOfItems: itemList.length,
      itemListElement: itemList.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
      })),
    })
  }

  if (type === "Course") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Course",
      name: title,
      description,
      url: `${BASE_URL}${url}`,
      provider: {
        "@type": "GovernmentOrganization",
        name: "Délégation générale à l'emploi et à la formation professionnelle (DGEFP)",
        url: "https://travail-emploi.gouv.fr",
      },
      ...(courseCredential ? { educationalCredentialAwarded: courseCredential } : {}),
      ...(courseDuration ? { timeRequired: courseDuration } : {}),
      hasCourseInstance: {
        "@type": "CourseInstance",
        // L'alternance combine formation en école et travail en entreprise.
        courseMode: "blended",
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
        <JsonLdScript key={index} schema={schema} />
      ))}
    </>
  )
}
