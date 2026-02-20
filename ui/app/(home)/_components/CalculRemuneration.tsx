import Card from "@codegouvfr/react-dsfr/Card"

export const CalculRemuneration = () => {
  return (
    <Card
      title={"Je calcule ma rémunération"}
      desc={"Répondez à quelques questions pour connaître votre future rémunération en alternance"}
      background
      border
      horizontal
      enlargeLink
      imageAlt=""
      imageUrl="/images/home_pics/illu-calcul-remuneration.svg"
      linkProps={{
        href: "/salaire-alternant",
      }}
      ratio="33/66"
      size="medium"
    />
  )
}
