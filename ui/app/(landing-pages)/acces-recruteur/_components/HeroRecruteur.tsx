import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid2 as Grid, List, ListItem, ListItemIcon, Typography } from "@mui/material"
import Image from "next/image"

import { ConnectionActions } from "@/app/(espace-pro)/_components/ConnectionActions"
import { FollowLinkedIn } from "@/app/(espace-pro)/_components/FollowLinkedIn"
import { PromoRessources } from "@/app/(espace-pro)/_components/promoRessources"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

const PostezVotreOffre = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Image src="/images/home_pics/illu-offreemploi.svg" width={529} height={280} alt="" />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography component="h3" variant="h3" sx={{ mb: 2 }}>
          Postez votre offre d'alternance en quelques secondes
        </Typography>
        <Typography>
          Exprimez votre besoin en quelques clics, nous générons votre offre instantanément. Retrouvez vos offres dans votre compte en vous connectant avec votre email uniquement.
        </Typography>
      </Grid>
    </Grid>
  )
}

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

const OrganismesMandataires = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Image src="/images/home_pics/illu-solliciterCFA.svg" alt="" aria-hidden={true} width={561} height={378} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography component="h3" variant="h3" sx={{ mb: 2 }}>
          Identifiez facilement les organismes de formation en lien avec votre offre d’emploi
        </Typography>
        <Typography>Vous pouvez choisir d’être accompagné par les centres de formation et votre OPCO de rattachement, afin d’accélérer vos recrutements.</Typography>
      </Grid>
    </Grid>
  )
}

const GerezOffres = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Image src="/images/home_pics/illu-candidatures.svg" alt="" width={571} height={308} />
      </Grid>
      <Grid container size={{ xs: 12, md: 6 }} spacing={fr.spacing("3w")} sx={{ alignItems: "center", justifyContent: "left" }}>
        <Grid>
          <Box
            component="span"
            sx={{
              background: "linear-gradient(90deg,#6a11cb,#2575fc)",
              color: "#fff",
              borderRadius: "80px",
              lineHeight: "32px",
              px: fr.spacing("3w"),
              fontSize: "20px",
              fontWeight: "700",
            }}
          >
            Bientôt
          </Box>
        </Grid>
        <Grid>
          <Typography component="h3" variant="h3" sx={{ mb: 2 }}>
            Gérez vos offres de manière collaborative
          </Typography>
          <Typography>Un accès multi-comptes permettra à plusieurs personnes de votre entreprise d’accéder et de gérer vos offres d&apos;emploi.</Typography>
          <Typography component="h3" variant="h3" sx={{ mb: 2 }}>
            Consultez et gérez vos candidatures
          </Typography>
          <Typography>Vérifiez d&apos;un coup d&apos;œil la progression des candidatures pour définir les prochaines étapes.</Typography>
        </Grid>
      </Grid>
    </Grid>
  )
}

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

export const HeroRecruteur = () => {
  return (
    <Grid container spacing={fr.spacing("8w")} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid>
        <Box sx={{ p: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Grid container spacing={10} sx={{ alignItems: "center", justifyContent: "center" }}>
            <PostezVotreOffre />
            <OffresGratuites />
            <OrganismesMandataires />
          </Grid>
        </Box>
      </Grid>
      <Grid>
        <Box sx={{ p: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <GerezOffres />
        </Box>
      </Grid>
      <Grid>
        <AlgoRecruteur withLinks={true} />
      </Grid>
      <Grid>
        <Box sx={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
          <PromoRessources target="recruteur" />
        </Box>
      </Grid>
      <Grid>
        <Box sx={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
          <Box sx={{ typography: "h2", textAlign: "center" }}> Vous souhaitez recruter un alternant pour votre entreprise ?</Box>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <ConnectionActions service="entreprise" />
          </Box>
        </Box>
      </Grid>
      <Grid>
        <Box sx={{ p: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}>
          <FollowLinkedIn />
        </Box>
      </Grid>
    </Grid>
  )
}
