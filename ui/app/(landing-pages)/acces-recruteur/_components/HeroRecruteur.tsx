import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid2 as Grid, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

const PostezVotreOffre = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ sm: 12, md: 6 }}>
        <Image src="/images/home_pics/illu-offreemploi.svg" width={529} height={280} alt="" />
      </Grid>
      <Grid size={{ sm: 12, md: 6 }}>
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
      <Grid size={{ sm: 12, md: 6 }} sx={{ order: { xs: 2, md: 1 } }}>
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
      <Grid size={{ sm: 12, md: 6 }} sx={{ order: { xs: 1, md: 2 } }}>
        <Image src="/images/home_pics/illu-plateformesjeunes.svg" alt="" aria-hidden={true} width={504} height={292} />
      </Grid>
    </Grid>
  )
}

const OrganismesMandataires = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ sm: 12, md: 6 }}>
        <Image src="/images/home_pics/illu-solliciterCFA.svg" alt="" aria-hidden={true} width={561} height={378} />
      </Grid>
      <Grid size={{ sm: 12, md: 6 }}>
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
      <Grid size={{ sm: 12, md: 6 }}>
        <Image src="/images/home_pics/illu-candidatures.svg" alt="" width={571} height={308} />
      </Grid>
      <Grid container size={{ sm: 12, md: 6 }} spacing={fr.spacing("3w")} sx={{ alignItems: "center", justifyContent: "left" }}>
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

export const HeroRecruteur = () => {
  return (
    <Grid container spacing={10} sx={{ alignItems: "center", justifyContent: "center" }}>
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
    </Grid>
  )
}
