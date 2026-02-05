import Card from "@codegouvfr/react-dsfr/Card"

export const AllerPlusLoinItem = ({ title, imageUrl, description, path }: { title: string; imageUrl: string; description: string; path: string }) => (
  <Card border enlargeLink size="medium" linkProps={{ href: path }} title={title} desc={description} imageUrl={imageUrl} imageAlt={""} style={{ height: "100%" }} />
)
