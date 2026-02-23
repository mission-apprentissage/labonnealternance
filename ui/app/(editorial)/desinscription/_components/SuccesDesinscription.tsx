import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { baseUrl } from "@/config/config"

const SuccesDesinscription = () => (
  <div>
    <Box sx={{ border: "1px solid #000091", p: fr.spacing("8v"), mb: fr.spacing("6v") }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: fr.spacing("4v") }}>
        <Image width={250} height={50} src="/images/home_pics/mail-in-clouds.svg" alt="" />
        <Box>
          <Typography variant="h1" sx={{ mb: fr.spacing("4v") }}>
            Merci pour votre signalement.
          </Typography>
          <Typography
            sx={{
              fontSize: "18px",
            }}
          >
            Votre établissement vient d'être déréférencé du volet candidature spontanée de La bonne alternance.
          </Typography>
        </Box>
      </Box>
    </Box>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      <Box>
        <Typography sx={{ fontWeight: 700, pb: fr.spacing("6v") }}>En complément, permettez-nous de vous expliquer notre fonctionnement.</Typography>
        <Typography sx={{ pb: fr.spacing("6v") }}>
          La bonne alternance est un service public, porté par différents ministères (Emploi, Education Nationale, Transition numérique). Notre rôle est de faciliter les entrées en
          alternance
        </Typography>
        <Typography>Pour cela, nous exposons différents types d'entreprises :</Typography>

        <Stack spacing={2} sx={{ mt: fr.spacing("6v") }}>
          <Box sx={{ display: "flex", gap: fr.spacing("4v"), flexDirection: "column" }}>
            <Typography sx={{ display: "list-item", ml: fr.spacing("4v") }}>
              Celles ayant diffusé une offre d'emploi sur notre{" "}
              <DsfrLink aria-label="Accéder au formulaire de dépôt simplifié de La bonne alternance" href={`${baseUrl}/acces-recruteur`}>
                formulaire de dépôt simplifié
              </DsfrLink>
            </Typography>

            <Typography sx={{ display: "list-item", ml: fr.spacing("4v") }}>
              Celles ayant diffusé une offre d'emploi sur{" "}
              <DsfrLink aria-label="Accéder au site de France Travail - nouvelle fenêtre" href="https://www.francetravail.fr">
                France Travail
              </DsfrLink>{" "}
              ou ses{" "}
              <DsfrLink
                aria-label="Accéder au site de France Travail - nouvelle fenêtre"
                href="https://www.francetravail.fr/candidat/vos-services-en-ligne/des-partenaires-pour-vous-propos.html"
              >
                sites partenaires
              </DsfrLink>
            </Typography>

            <Typography sx={{ display: "list-item", ml: fr.spacing("4v") }}>
              Celles n'ayant pas diffusé d'offres, mais ayant été identifiées comme "à fort potentiel d'embauche en alternance" grâce à l'analyse de diverses données publiques.
            </Typography>
          </Box>
        </Stack>

        <Typography sx={{ py: fr.spacing("6v"), fontWeight: 700 }}>Votre établissement se situait dans la troisième catégorie.</Typography>
        <Typography>
          Pour cette raison, il était affiché sur La bonne alternance et vous receviez des candidatures spontanées en conséquence. L'email ainsi que le numéro de téléphone
          référencés sur votre entreprise sont issus de votre espace recruteur France Travail.
        </Typography>
        <Typography sx={{ mt: fr.spacing("6v") }}>
          Nous restons à votre disposition si vous souhaitez de nouveau être référencé sur La bonne alternance.
          <br />
          <br />
          Bien cordialement,
          <br />
          L'équipe La bonne alternance
        </Typography>
      </Box>

      <Box sx={{ p: fr.spacing("6v"), backgroundColor: "#f5f5fe" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: fr.spacing("6v") }}>
          <Image src="/images/icons/tete.svg" alt="" width={50} height={50} />
          <Typography sx={{ fontWeight: 700, pl: fr.spacing("4v") }}>Le saviez-vous ?</Typography>
        </Box>

        <Typography sx={{ fontWeight: 700, mb: fr.spacing("6v") }}>Recruter un alternant présente de multiples avantages :</Typography>

        <Stack spacing={2} sx={{ mt: fr.spacing("6v") }}>
          <Box sx={{ display: "flex", gap: fr.spacing("4v"), flexDirection: "column" }}>
            <Typography sx={{ display: "list-item", ml: fr.spacing("4v") }}>Anticiper et former des salariés aux besoins de votre entreprise</Typography>
            <Typography sx={{ display: "list-item", ml: fr.spacing("4v") }}>Répondre aux problématiques de recrutement en formant un vivier de candidats employables</Typography>
            <Typography sx={{ display: "list-item", ml: fr.spacing("4v") }}>Disposer d'un regard nouveau et sensibilisé aux enjeux de demain</Typography>
            <Typography sx={{ display: "list-item", ml: fr.spacing("4v") }}>
              <DsfrLink
                aria-label="Accès au site de simulation des aides au recrutement en alternance - nouvelle fenêtre"
                href="https://alternance.emploi.gouv.fr/simulateur-employeur/etape-1"
              >
                Profiter d'un financement gouvernemental
              </DsfrLink>
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Stack>
  </div>
)

export default SuccesDesinscription
