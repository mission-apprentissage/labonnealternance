import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { metierData } from "@/app/(editorial)/alternance/_components/metier_data"
import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.planDuSite.getMetadata().title,
  description: PAGES.static.planDuSite.getMetadata().description,
}

export default function PlanDuSite() {
  return (
    <div>
      <Box>
        <Breadcrumb pages={[PAGES.static.planDuSite]} />
        <DefaultContainer>
          <Box sx={{ p: fr.spacing("10v"), marginBottom: fr.spacing("10v"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
            <Grid container spacing={fr.spacing("2v")}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography id="editorial-content-container" component={"h1"} variant="h1" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.default.info.default }}>
                  Plan du site
                </Typography>
                <Box
                  component="hr"
                  sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 9 }}>
                <Box
                  component="nav"
                  role="navigation"
                  aria-label="Navigation du plan du site"
                  sx={{
                    "& ul": {
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: fr.spacing("2v"),
                    },
                    "& ul ul": {
                      paddingLeft: 0,
                    },
                  }}
                >
                  <Box component="ul" sx={{ pl: fr.spacing("4v") }}>
                    <Box component="li">
                      <DsfrLink href={PAGES.static.home.getPath()}>Page d'accueil</DsfrLink>
                    </Box>
                    <Box component="li">
                      <DsfrLink href={PAGES.static.authentification.getPath()}>Connexion</DsfrLink>
                    </Box>
                    <Box component="li">
                      <DsfrLink href={PAGES.static.espaceProCreationEntreprise.getPath()}>Création de compte</DsfrLink>
                    </Box>
                    <Box component="li">
                      <Typography component="h2" variant="h2" mt={fr.spacing("4v")} mb={fr.spacing("2v")}>
                        Je suis candidat
                      </Typography>
                      <Box component="ul">
                        <Box component="li">
                          <DsfrLink href={PAGES.dynamic.recherche({}).getPath()}>Je recherche une alternance</DsfrLink>
                        </Box>
                        <Box component="li">
                          <DsfrLink href={PAGES.static.guideAlternant.getPath()}>Je m'informe sur l'alternance</DsfrLink>
                        </Box>
                        <Box component="li">
                          <DsfrLink href={PAGES.static.salaireAlternant.getPath()}>Je calcule ma rémunération</DsfrLink>
                        </Box>
                      </Box>
                    </Box>
                    <Box component="li">
                      <Typography component="h2" variant="h2" mt={fr.spacing("4v")} mb={fr.spacing("2v")}>
                        Je suis recruteur
                      </Typography>
                      <Box component="ul">
                        <Box component="li">
                          <DsfrLink href={PAGES.static.espaceProCreationEntreprise.getPath()}>Je recrute un alternant</DsfrLink>
                        </Box>
                        <Box component="li">
                          <DsfrLink href={PAGES.static.guideRecruteur.getPath()}>Je m'informe sur l'alternance</DsfrLink>
                        </Box>
                      </Box>
                    </Box>
                    <Box component="li">
                      <Typography component="h2" variant="h2" mt={fr.spacing("4v")} mb={fr.spacing("2v")}>
                        Je suis CFA
                      </Typography>
                      <Box component="ul">
                        <Box component="li">
                          <DsfrLink href={PAGES.static.espaceProCreationCfa.getPath()}>Je recrute pour mes partenaires</DsfrLink>
                        </Box>
                        <Box component="li">
                          <DsfrLink href={PAGES.static.guideCfa.getPath()}>Je m'informe sur l'alternance</DsfrLink>
                        </Box>
                        <Box component="li">
                          <DsfrLink href={PAGES.static.guideCfaLaCarteEtudiantDesMetiers.getPath()}>Je télécharge la carte d'étudiant des métiers</DsfrLink>
                        </Box>
                      </Box>
                    </Box>
                    <Box component="li">
                      <Typography component="h2" variant="h2" mt={fr.spacing("4v")} mb={fr.spacing("2v")}>
                        À propos
                      </Typography>
                      <Box component="ul">
                        <Box component="li">
                          <DsfrLink href={PAGES.static.aPropos.getPath()}>À propos</DsfrLink>
                        </Box>
                        <Box component="li">
                          <DsfrLink href={PAGES.static.blog.getPath()} external>
                            Blog
                          </DsfrLink>
                        </Box>
                        <Box component="li">
                          <DsfrLink href={PAGES.static.metiers.getPath()}>Métiers</DsfrLink>
                        </Box>
                        <Box component="li">
                          <DsfrLink href={PAGES.static.contact.getPath()}>Contact</DsfrLink>
                        </Box>
                      </Box>
                    </Box>
                    <Box component="li">
                      <Typography component="h2" variant="h2" mt={fr.spacing("4v")} mb={fr.spacing("2v")}>
                        Aide et ressources
                      </Typography>
                      <Box component="ul">
                        <Box component="li">
                          <DsfrLink href={PAGES.static.planDuSite.getPath()}>Plan du site</DsfrLink>
                        </Box>
                        <Box component="li">
                          <DsfrLink href={PAGES.static.faq.getPath()}>FAQ</DsfrLink>
                        </Box>
                        <Box component="li">
                          <DsfrLink href={PAGES.static.statistiques.getPath()}>Statistiques</DsfrLink>
                        </Box>
                      </Box>
                    </Box>
                    <Box component="li">
                      <Typography component="h2" variant="h2" mt={fr.spacing("4v")} mb={fr.spacing("2v")}>
                        Développeurs
                      </Typography>
                      <Box component="ul">
                        <Box component="li">
                          <DsfrLink href={PAGES.static.EspaceDeveloppeurs.getPath()}>Espace développeurs</DsfrLink>
                        </Box>
                        <Box component="li">
                          <DsfrLink href={PAGES.static.codeSources.getPath()} external>
                            Code source v{publicConfig.version}
                          </DsfrLink>
                        </Box>
                      </Box>
                    </Box>
                    <Box component="li">
                      <Typography component="h2" variant="h2" mt={fr.spacing("4v")} mb={fr.spacing("2v")}>
                        Alternance par ville
                      </Typography>
                      <Box component="ul">
                        {villeData.map((ville) => (
                          <Box component="li" key={ville.slug}>
                            <DsfrLink href={PAGES.dynamic.seoVille(ville.slug).getPath()}>Alternance à {ville.ville}</DsfrLink>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    <Box component="li">
                      <Typography component="h2" variant="h2" mt={fr.spacing("4v")} mb={fr.spacing("2v")}>
                        Alternance par métier
                      </Typography>
                      <Box component="ul">
                        {metierData.map((metier) => (
                          <Box component="li" key={metier.slug}>
                            <DsfrLink href={PAGES.dynamic.seoMetier(metier.slug).getPath()}>{metier.metier}</DsfrLink>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DefaultContainer>
      </Box>
    </div>
  )
}
