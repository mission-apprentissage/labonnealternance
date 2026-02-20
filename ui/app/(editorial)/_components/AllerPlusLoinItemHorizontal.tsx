import Card from "@codegouvfr/react-dsfr/Card"

export const AllerPlusLoinItemHorizontal = ({ title, imageUrl, description, path }: { title: string; imageUrl?: string; description: string; path: string }) => (
  <Card border horizontal size="medium" ratio="33/66" style={{ height: "100%" }} linkProps={{ href: path }} title={title} desc={description} imageUrl={imageUrl} imageAlt="" />
)
