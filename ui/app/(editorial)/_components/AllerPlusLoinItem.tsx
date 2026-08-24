import Card from "@codegouvfr/react-dsfr/Card"

export const AllerPlusLoinItem = ({ title, imageUrl, description, path, source }: { title: string; imageUrl?: string; description: string; path: string; source?: string }) => (
  <Card
    border
    enlargeLink
    size="medium"
    // guide_source et non source : « source » est un paramètre réservé de Plausible (attribution
    // d'acquisition), une URL interne qui le porte polluerait les stats.
    linkProps={{ href: `${path}${source ? `?guide_source=${source}` : ""}` }}
    title={title}
    desc={description}
    imageUrl={imageUrl}
    imageAlt={""}
    style={{ height: "100%" }}
  />
)
