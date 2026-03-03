import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Typography, Stack } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

export const AlgoRecruteur = ({ withLinks = false }: { withLinks?: boolean }) => {
  return (
    <Box
      sx={{
        p: { xs: fr.spacing("4v"), sm: fr.spacing("4v"), md: fr.spacing("10v") },
        borderRadius: "10px",
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <Grid container spacing={fr.spacing("16v")} sx={{ alignItems: "center", justifyContent: "center" }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography component="h2" variant="h2" sx={{ mb: fr.spacing("4v") }}>
            La bonne alternance révèle
            <br />
            <Typography component="h2" variant="h2" sx={{ color: "#0063BC" }}>
              le marché caché de l&apos;emploi
            </Typography>{" "}
          </Typography>
          <Box component="hr" sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: "4px solid #0063CB", opacity: 1 }} />
          <Stack spacing={2} sx={{ my: fr.spacing("6v") }}>
            <Box sx={{ display: "flex", gap: fr.spacing("4v"), flexDirection: "column" }}>
              <Typography sx={{ display: "list-item", ml: fr.spacing("4v") }}>
                <span className="fr-text--bold">Celles ayant émis un besoin en recrutement </span>sur notre plateforme ainsi que sur France Travail et ses sites partenaires
              </Typography>
              <Typography sx={{ display: "list-item", ml: fr.spacing("4v") }}>
                <span className="fr-text--bold">
                  Celles n&apos;ayant pas diffusé d&apos;offres, mais ayant été identifiées comme &quot;à fort potentiel d&apos;embauche en alternance&quot;
                </span>{" "}
                grâce à l'analyse de diverses données publiques (données de recrutement, données financières, etc.). La bonne alternance identifie ainsi chaque mois une liste
                restreinte d'entreprises à fort potentiel d'embauche en alternance pour faciliter les démarches de candidatures spontanées de ses utilisateurs.
              </Typography>
            </Box>
          </Stack>
          {withLinks && (
            <DsfrLink arrow="right" href="/desinscription" aria-label="Accès au formulaire de désinscription au service d'envoi de candidatures spontanées">
              Je ne souhaite plus recevoir de candidature spontanée
            </DsfrLink>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Image src="/images/icons/algo_recruiter.svg" alt="" width={398} height={431} style={{ width: "100%", height: "auto" }} />
        </Grid>
      </Grid>
    </Box>
  )
}
