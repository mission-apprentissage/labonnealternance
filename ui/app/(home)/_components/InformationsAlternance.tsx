import Card from "@codegouvfr/react-dsfr/Card"

export const InformationsAlternance = () => {
  return (
    <Card
      title="Je m'informe sur l'alternance"
      titleAs="h2"
      desc={"Les réponses à vos questions pour tout savoir sur l'alternance"}
      background
      border
      horizontal
      enlargeLink
      imageAlt=""
      imageUrl="/images/home_pics/illu-informations-alternance.svg"
      linkProps={{
        href: "/guide-alternant",
      }}
      ratio="33/66"
      size={"medium"}
    />
  )
}
