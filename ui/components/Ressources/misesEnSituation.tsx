import { Grid } from "@mui/material"

import { CardForLink } from "./CardForLink"

const MisesEnSituation = ({ target }: { target: "candidat" | "cfa" }) => {
  return (
    <Grid container spacing={2} sx={{ my: 6 }}>
      {target === "candidat" && (
        <Grid size={{ xs: 12, md: 6 }}>
          <CardForLink
            imageUrl="/images/pages_ressources/didask-module1.svg"
            text="Vous recherchez votre formation ?"
            link="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
            linkTitle="Préparez-vous à échanger avec une école"
            linkAriaLabel="Préparez-vous à échanger avec une école - nouvelle fenêtre"
          />
        </Grid>
      )}
      <Grid size={{ xs: 12, md: 6 }}>
        <CardForLink
          imageUrl="/images/pages_ressources/didask-module2.svg"
          text="Vous recherchez votre employeur ?"
          link="https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e"
          linkTitle="Apprenez à bien cibler les entreprises"
          linkAriaLabel="Apprenez à bien cibler les entreprises - nouvelle fenêtre"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CardForLink
          imageUrl="/images/pages_ressources/didask-module3.svg"
          text="Vous avez bientôt un entretien d’embauche ?"
          link="https://dinum.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
          linkTitle="Entraînez-vous pour avoir plus de chances de réussite"
          linkAriaLabel="Entraînez-vous pour avoir plus de chances de réussite - nouvelle fenêtre"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <CardForLink
          imageUrl="/images/pages_ressources/didask-module4.svg"
          text="Vous allez bientôt démarrer votre contrat ?"
          link="https://dinum.didask.com/courses/demonstration/6283bd5ad9c7ae00003ede91"
          linkTitle="Familiarisez-vous avec la posture à adopter en entreprise"
          linkAriaLabel="Familiarisez-vous avec la posture à adopter en entreprise - nouvelle fenêtre"
        />
      </Grid>
    </Grid>
  )
}

export default MisesEnSituation
