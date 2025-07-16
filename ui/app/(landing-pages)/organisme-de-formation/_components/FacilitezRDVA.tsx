import { Grid2 as Grid, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

export const FacilitezRDVA = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography component="h3" variant="h3" sx={{ mb: 2 }}>
          Répondez facilement aux candidats intéressés par vos formations
        </Typography>
        <Typography>Vous recevez directement dans votre boite mail des demandes de candidats intéressés par vos formations et pouvez leur répondre en quelques clics.</Typography>
        <Typography sx={{ fontSize: "14px", mt: 2 }}>
          *Vous pouvez à tout moment vous désinscrire de ce service en{" "}
          <DsfrLink size="sm" href="mailto:labonnealternance@beta.gouv.fr?subject=CFA désactivation RDVA" aria-label="Adresse email de l'équipe La bonne alternance">
            contactant notre équipe
          </DsfrLink>
          .
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Image src="/images/home_pics/facilitezRDVA.svg" width={585} height={298} alt="" />
      </Grid>
    </Grid>
  )
}
