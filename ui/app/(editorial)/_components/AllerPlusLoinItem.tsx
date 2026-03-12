import Card from "@codegouvfr/react-dsfr/Card"

export const AllerPlusLoinItem = ({ title, imageUrl, description, path, source }: { title: string; imageUrl?: string; description: string; path: string; source?: string }) => (
  <Card
    border
    enlargeLink
    size="medium"
    linkProps={{ href: `${path}${source ? `?source=${source}` : ""}` }}
    title={title}
    desc={description}
    imageUrl={imageUrl}
    imageAlt={""}
    style={{ height: "100%" }}
  />
)
