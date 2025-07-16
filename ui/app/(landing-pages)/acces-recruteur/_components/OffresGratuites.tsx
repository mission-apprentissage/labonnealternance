import { Grid2 as Grid, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

export const OffresGratuites = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 2, md: 1 } }}>
        <Typography component="h3" variant="h3" sx={{ mb: 2 }}>
          Vos offres sont diffusées gratuitement au plus près des candidats
        </Typography>
        <Typography fontSize="18px" mt={4}>
          Elles sont mises en ligne sur les sites les plus visités par les candidats en recherche d’alternance :{" "}
          <DsfrLink aria-label="Accès au site un jeune une solution - nouvelle fenêtre" href="https://www.1jeune1solution.gouv.fr">
            1jeune1solution
          </DsfrLink>
          ,{" "}
          <DsfrLink aria-label="Accès au site Parcoursup - nouvelle fenêtre" href="https://www.parcoursup.fr">
            Parcoursup
          </DsfrLink>{" "}
          ,{" "}
          <DsfrLink aria-label="Accès au site Choisir son affectation après la 3è - nouvelle fenêtre" href="https://affectation3e.phm.education.gouv.fr/pna-public/">
            Choisir son affectation après la 3è
          </DsfrLink>{" "}
          ,{" "}
          <DsfrLink aria-label="Accès au site Mon master - nouvelle fenêtre" href="https://www.monmaster.gouv.fr/">
            Mon master
          </DsfrLink>{" "}
          ,{" "}
          <DsfrLink
            aria-label="Liste des partenaires diffuseurs des offres - nouvelle fenêtre"
            href="https://mission-apprentissage.notion.site/Liste-des-partenaires-de-La-bonne-alternance-3e9aadb0170e41339bac486399ec4ac1"
          >
            et bien d’autres
          </DsfrLink>
          .
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 2 } }}>
        <Image src="/images/home_pics/illu-plateformesjeunes.svg" alt="" aria-hidden={true} width={504} height={292} />
      </Grid>
    </Grid>
  )
}
