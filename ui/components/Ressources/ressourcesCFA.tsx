import { fr } from "@codegouvfr/react-dsfr"
import { Typography, Box, List, ListItem } from "@mui/material"
import Image from "next/image"

import ConseilsEtAstuces from "./conseilsEtAstuces"
import FonctionnementPlateforme from "./fonctionnementPlateforme"
import MisesEnSituation from "./misesEnSituation"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

const RessourcesCFA = () => {
  return (
    <Box>
      <Typography>
        La bonne alternance vous propose un ensemble d’outils pour soutenir vos démarches d’accompagnement auprès des jeunes et de vos entreprises partenaires.
      </Typography>
      <Typography component={"h3"} variant="h3" sx={{ my: fr.spacing("4v") }}>
        Liens utiles pour accompagner vos candidats
      </Typography>
      <Typography>Proposez-leur de s’entraîner avec nos 3 parcours de mise en situation :</Typography>
      <MisesEnSituation target="cfa" />
      <Typography sx={{ mb: 2 }}>Partagez-leurs des conseils et astuces pour les aider dans leurs démarches de recherche de formation et d’emploi en alternance :</Typography>
      <ConseilsEtAstuces />
      <Box display="flex" alignItems="center" mt={fr.spacing("12v")} mb={fr.spacing("12v")}>
        <Image src="/images/pages_ressources/conseils et astuces.svg" alt="" width={64} height={64} aria-hidden="true" style={{ marginRight: fr.spacing("4v") }} />
        <Typography variant="h3" component="h3">
          Autres liens utiles
        </Typography>
      </Box>
      <Box ml={fr.spacing("8v")}>
        <List sx={{ listStyleType: "disc", pl: fr.spacing("4v") }}>
          <ListItem sx={{ display: "list-item", mb: fr.spacing("4v") }}>
            Pour rechercher une formation en alternance, le{" "}
            <DsfrLink href="https://catalogue-apprentissage.intercariforef.org/" aria-label="Accéder au catalogue des offres de formation en apprentissage">
              Catalogue des offres de formations en apprentissage
            </DsfrLink>{" "}
            du Réseau des Carif-Oref centralise nationalement l'ensemble des offres collectées régionalement.
          </ListItem>

          <ListItem sx={{ display: "list-item", mb: 2 }}>
            <DsfrLink href="https://travail-emploi.gouv.fr/IMG/pdf/precis-apprentissage.pdf" aria-label="Accéder au précis de l'apprentissage">
              Le Précis de l’apprentissage
            </DsfrLink>{" "}
            vous présente des repères sur l’apprentissage, issus des travaux de la DGEFP. Il vise à harmoniser les pratiques des acteurs de l’apprentissage.
          </ListItem>

          <ListItem sx={{ display: "list-item", mb: 2 }}>
            <DsfrLink href="https://www.cfadock.fr/doc/Vade-mecum%20CFA.pdf" aria-label="Accéder au vade-mecum CFA">
              Le “Vade-mecum CFA”
            </DsfrLink>{" "}
            précise les modalités pratiques de gestion des contrats d’apprentissage, en concertation avec les têtes de réseau CFA et la DGEFP.
          </ListItem>

          <ListItem sx={{ display: "list-item", mb: 2 }}>
            <Typography component="span" fontWeight={700}>
              Le tableau de bord de l’apprentissage
            </Typography>{" "}
            permet de visualiser en temps réel la situation de l’apprentissage sur un territoire :
            <br />- Le volume d’apprentis
            <br />- Le nombre d’apprenants sans contrat
            <br />- Le nombre en situation de rupture de contrat
            <br />- Le nombre en situation d’abandon
            <br />
            <DsfrLink href="https://cfas.apprentissage.beta.gouv.fr/" aria-label="Accéder au tableau de bord de l'apprentissage">
              En savoir plus
            </DsfrLink>
          </ListItem>

          <ListItem sx={{ display: "list-item" }}>Attirez des candidats en offrant plus de visibilité à vos formations et offres d’emploi</ListItem>
        </List>
      </Box>
      <Box display="flex" alignItems="center" mt={fr.spacing("12v")} mb={fr.spacing("12v")}>
        <Image src="/images/pages_ressources/offres completes.svg" alt="" width={64} height={64} aria-hidden="true" style={{ marginRight: fr.spacing("4v") }} />
        <Box>
          <Typography fontWeight={700} mb={fr.spacing("4v")}>
            Attirez des candidats en offrant plus de visibilité à vos formations et offres d’emplois
          </Typography>
          <DsfrLink href="/organisme-de-formation" aria-label="Accès à la page d'accueil">
            Accéder à la page d’accueil
          </DsfrLink>
        </Box>
      </Box>
      <FonctionnementPlateforme />
    </Box>
  )
}

export default RessourcesCFA
