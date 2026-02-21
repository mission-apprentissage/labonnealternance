"use client"

import { Grid, Typography } from "@mui/material"
import { fr } from "@codegouvfr/react-dsfr"
import { FormulaireSituation } from "./FormulaireSituation"
import { AllerPlusLoin } from "./AllerPlusLoin"
import { ResultatSimulation } from "./ResultatSimulation"
import { SimulateurProvider } from "@/app/(landing-pages)/salaire-alternant/context/SimulateurContext"

export const SimulateurRemuneration = () => (
  <SimulateurProvider>
    <Grid container spacing={6}>
      <Typography variant="h1" color={fr.colors.decisions.text.default.info.default} fontWeight={700}>
        Salaire alternant : simulateur de rémunération
      </Typography>
      <Grid container spacing={0} border={`2px solid ${fr.colors.decisions.border.default.blueFrance.default}`} width={"100%"}>
        <Grid size={{ xs: 12, md: 5 }}>
          <FormulaireSituation />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }} sx={{ backgroundColor: fr.colors.decisions.background.contrast.info.default }} width={"100%"}>
          <ResultatSimulation />
        </Grid>
      </Grid>
      <AllerPlusLoin />
    </Grid>
  </SimulateurProvider>
)
