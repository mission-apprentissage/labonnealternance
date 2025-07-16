import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid2 as Grid, List, ListItem, ListItemIcon, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

export const AlgoRecruteur = ({ withLinks = false }: { withLinks?: boolean }) => {
  return (
    <Box sx={{ p: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}>
      <Grid container spacing={fr.spacing("8w")} sx={{ alignItems: "center", justifyContent: "center" }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography sx={{ mb: 2, fontSize: "40px", fontWeight: "700", lineHeight: "48px" }}>
            La bonne alternance révèle
            <br />
            <Typography component={"span"} sx={{ color: "#0063BC", fontSize: "40px", fontWeight: "700", lineHeight: "48px" }}>
              le marché caché de l&apos;emploi
            </Typography>{" "}
          </Typography>
          <Box component="hr" sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: "4px solid #0063CB", opacity: 1 }} />
          <List>
            <ListItem sx={{ alignItems: "flex-start", px: 0 }}>
              <ListItemIcon sx={{ minWidth: "30px" }}>
                <Box component={"span"} className={fr.cx("ri-circle-fill", "fr-icon--xs")} />
              </ListItemIcon>
              <Typography>
                <span className="fr-text--bold">Celles ayant émis un besoin en recrutement </span>sur notre plateforme ainsi que sur France Travail et ses sites partenaires
              </Typography>
            </ListItem>
            <ListItem sx={{ alignItems: "flex-start", px: 0 }}>
              <ListItemIcon sx={{ minWidth: "30px" }}>
                <Box component={"span"} className={fr.cx("ri-circle-fill", "fr-icon--xs")} />
              </ListItemIcon>
              <Typography>
                <span className="fr-text--bold">
                  Celles n&apos;ayant pas diffusé d&apos;offres, mais ayant été identifiées comme &quot;à fort potentiel d&apos;embauche en alternance&quot;
                </span>{" "}
                grâce à l'analyse de diverses données publiques (données de recrutement, données financières, etc.). La bonne alternance identifie ainsi chaque mois une liste
                restreinte d'entreprises à fort potentiel d'embauche en alternance pour faciliter les démarches de candidatures spontanées de ses utilisateurs.
              </Typography>
            </ListItem>
          </List>
          {withLinks && (
            <DsfrLink arrow="right" href="/desinscription" aria-label="Accès au formulaire de désinscription au service d'envoi de candidatures spontanées">
              Je ne souhaite plus recevoir de candidature spontanée
            </DsfrLink>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Image src="/images/icons/algo_recruiter.svg" alt="" width={398} height={431} />
        </Grid>
      </Grid>
    </Box>
  )
}
