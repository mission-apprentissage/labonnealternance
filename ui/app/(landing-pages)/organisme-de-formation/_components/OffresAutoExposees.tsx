import { Grid, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const OffresAutoExposees = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Image src="/images/home_pics/illu-offreformation.svg" width={586} height={298} alt="" />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography component="h3" variant="h3" sx={{ mb: 2 }}>
          Vos formations en alternance sont automatiquement exposées
        </Typography>
        <Typography>
          Pour référencer et mettre à jour vos formations sur La bonne alternance, nul besoin de vous créer un compte, il vous suffit de les déclarer auprès du Carif-Oref de votre
          région.
          <br />
          <br />
          Elles sont ensuite nationalement agrégées par le Réseau des Carif-Oref puis automatiquement exposées sur La bonne alternance.{" "}
          <DsfrLink href={PAGES.static.faq.getPath() + "#cfa"} aria-label="Lien vers la FAQ des CFA">
            En savoir plus
          </DsfrLink>
        </Typography>
      </Grid>
    </Grid>
  )
}
