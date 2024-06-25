import { Grid } from "@chakra-ui/react"

import { CardForLink } from "./CardForLink"

const MisesEnSituation = ({ target }: { target: "candidat" | "cfa" }) => {
  return (
    <Grid my={6} templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
      {target === "candidat" && (
        <CardForLink
          imageUrl="/images/pages_ressources/didask-module1.svg"
          text="Vous recherchez votre formation ?"
          link="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
          linkTitle="Préparez-vous à échanger avec une école"
          linkAriaLabel="Préparez-vous à échanger avec une école - nouvelle fenêtre"
        />
      )}
      <CardForLink
        imageUrl="/images/pages_ressources/didask-module2.svg"
        text="Vous recherchez votre employeur ?"
        link="https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e"
        linkTitle="Apprenez à bien cibler les entreprises"
        linkAriaLabel="Apprenez à bien cibler les entreprises - nouvelle fenêtre"
      />
      <CardForLink
        imageUrl="/images/pages_ressources/didask-module3.svg"
        text="Vous avez bientôt un entretien d’embauche ?"
        link="https://dinum.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
        linkTitle="Entraînez-vous pour avoir plus de chances de réussite"
        linkAriaLabel="Entraînez-vous pour avoir plus de chances de réussite - nouvelle fenêtre"
      />
      <CardForLink
        imageUrl="/images/pages_ressources/didask-module4.svg"
        text="Vous allez bientôt démarrer votre contrat ?"
        link="https://dinum.didask.com/courses/demonstration/6283bd5ad9c7ae00003ede91"
        linkTitle="Familiarisez-vous avec la posture à adopter en entreprise"
        linkAriaLabel="Familiarisez-vous avec la posture à adopter en entreprise - nouvelle fenêtre"
      />
    </Grid>
  )
}
export default MisesEnSituation
