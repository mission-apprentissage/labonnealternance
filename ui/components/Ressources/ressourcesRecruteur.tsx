import { Box, Stack, Typography, Grid2 as Grid, List, ListItem } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

import { CardForLink } from "./CardForLink"
import FonctionnementPlateforme from "./fonctionnementPlateforme"

const RessourcesRecruteur = () => {
  return (
    <Box>
      <Typography variant="body1">La bonne alternance vous propose un ensemble d’outils et de liens pour faciliter vos démarches liées à l’alternance.</Typography>

      <Typography variant="h2" fontSize={32} fontWeight={700} my={2}>
        Testez vos connaissances
      </Typography>

      <Typography variant="body1" mb={6}>
        Entraînez-vous avec notre premier parcours de mise en situation à destination des recruteurs :
      </Typography>

      <Grid container spacing={2} my={6}>
        <Grid size={{ xs: 12, md: 6 }}>
          <CardForLink
            imageUrl="/images/serrage-main.svg"
            link="https://dinum.didask.com/courses/lalternance-pour-les-recruteurs/65b8129d2ff4dca088d2bfce"
            text="Vous vous apprêtez à accueillir un·e alternant·e ?"
            linkTitle="Découvrez les étapes clés pour réussir son intégration"
            linkAriaLabel="Etapes pour accueillir un alternant - nouvelle fenêtre"
          />
        </Grid>
      </Grid>

      <Box display="flex" alignItems="center" my={6}>
        <Box mr={2}>
          <Image src="/images/pages_ressources/conseils et astuces.svg" alt="" width={60} height={60} aria-hidden="true" />
        </Box>
        <Typography variant="h2">Liens utiles</Typography>
      </Box>

      <List sx={{ listStyleType: "disc", pl: 2 }}>
        <ListItem sx={{ display: "list-item" }}>
          <Typography component="span" fontWeight={700}>
            Estimez le coût d’un alternant
          </Typography>{" "}
          pour votre entreprise avec le simulateur du Portail de l'alternance.{" "}
          <DsfrLink href="https://www.alternance.emploi.gouv.fr/simulateur-employeur/etape-1">En savoir plus</DsfrLink>
        </ListItem>

        <ListItem sx={{ display: "list-item" }}>
          En janvier dernier, le Gouvernement a annoncé son nouveau plan d’aide aux entreprises pour 2025.{" "}
          <DsfrLink href="https://entreprendre.service-public.fr/vosdroits/F23556">En savoir plus</DsfrLink>
        </ListItem>

        <ListItem sx={{ display: "list-item" }}>
          <Typography component="span" fontWeight={700}>
            Retrouvez les informations légales de votre entreprise
          </Typography>{" "}
          sur l’annuaire des entreprises, à partir de votre SIRET. <DsfrLink href="https://annuaire-entreprises.data.gouv.fr/">En savoir plus</DsfrLink>
        </ListItem>

        <ListItem sx={{ display: "list-item" }}>
          <Typography component="span" fontWeight={700}>
            Chaque entreprise est rattachée à un Opérateur de compétences (OPCO).
          </Typography>{" "}
          Il s’agit de votre interlocuteur de proximité pour vos démarches liées à l’alternance (financement des contrats, formation, ...). Votre OPCO peut vous aider à affiner vos
          besoins de recrutement. Aussi, sachez qu’en déposant une offre d’emploi en alternance sur le site de votre OPCO, celle-ci sera rediffusée sur les sites consultés par les
          jeunes.
          <br />
          Vous ne connaissez pas votre OPCO ? Retrouvez votre OPCO sur <DsfrLink href="https://quel-est-mon-opco.francecompetences.fr/">France compétences</DsfrLink>
        </ListItem>

        <ListItem sx={{ display: "list-item" }}>
          <Typography component="span" fontWeight={700}>
            Quelle est la différence entre un contrat en apprentissage et un contrat de professionnalisation ?
          </Typography>{" "}
          Le portail de l’alternance vous explique les différences.{" "}
          <DsfrLink href="https://www.alternance.emploi.gouv.fr/je-suis-employeur#Pour%20quel%20employeur%20?">En savoir plus</DsfrLink>
        </ListItem>

        <ListItem sx={{ display: "list-item" }}>
          <DsfrLink href="https://travail-emploi.gouv.fr/IMG/pdf/precis-apprentissage.pdf">Le Précis de l’apprentissage</DsfrLink> vous présente des repères sur l’apprentissage. Il
          est issu des travaux de la DGEFP et d’une consultation des acteurs institutionnels de l’apprentissage...
        </ListItem>

        <ListItem sx={{ display: "list-item" }}>
          Le contrat en apprentissage <DsfrLink href="https://www.service-public.fr/particuliers/vosdroits/R1319">Cerfa n° 10103*11</DsfrLink> doit être signé et transmis à votre
          OPCO <strong>au plus tard 5 jours après le démarrage du contrat</strong>. Gagnez du temps avec le service{" "}
          <DsfrLink href="https://contrat.apprentissage.beta.gouv.fr/">CERFA dématérialisé</DsfrLink>
        </ListItem>

        <ListItem sx={{ display: "list-item" }}>En tant qu’employeur, vous devez conserver le contrat signé pendant 5 ans en cas de contrôle.</ListItem>
      </List>

      <Box display="flex" alignItems="center" my={8}>
        <Box mr={2}>
          <Image src="/images/pages_ressources/recruteur.svg" alt="" width={189} height={119} aria-hidden="true" />
        </Box>
        <Stack>
          <Typography fontWeight={700} mb={1}>
            Diffusez simplement et gratuitement vos offres en alternance
          </Typography>
          <Box>
            <DsfrLink href="/acces-recruteur">Accéder à la page d’accueil</DsfrLink>
          </Box>
        </Stack>
      </Box>

      <FonctionnementPlateforme />
    </Box>
  )
}

export default RessourcesRecruteur
