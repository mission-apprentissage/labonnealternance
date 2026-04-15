"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import NextImage from "next/image"
import { useState } from "react"
import { AUTHTYPE } from "shared/constants/recruteur"
import Social from "@/app/(1jeune1solution)/components/Social"
import type { BandeauProps } from "@/app/(espace-pro)/_components/Bandeau"
import { CreationCompteForm } from "@/components/espace_pro/Authentification/CreationCompte"
import type { searchEntreprise } from "@/services/searchEntreprises"

type EntrepriseOrCfaType = typeof AUTHTYPE.ENTREPRISE | typeof AUTHTYPE.CFA

type Organisation = Awaited<ReturnType<typeof searchEntreprise>>[number]

export default function UnJeune1Solution() {
  const [organisationType, setOrganisationType] = useState<EntrepriseOrCfaType>(AUTHTYPE.ENTREPRISE)
  const [bandeau, setBandeau] = useState<BandeauProps>(null)

  console.log("bandeau", bandeau)
  console.log("organisationType", organisationType)

  const onSelectOrganisation = (organisation: Organisation | null) => {
    if (organisation?.activite_principale?.startsWith("85")) {
      setOrganisationType(AUTHTYPE.CFA)
    } else {
      setOrganisationType(AUTHTYPE.ENTREPRISE)
    }
  }

  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("8v"),
        marginTop: { xs: 0, lg: fr.spacing("8v") },
        marginBottom: fr.spacing("16v"),
        px: { xs: 0, lg: fr.spacing("4v") },
        pt: { xs: fr.spacing("6v"), sm: 0 },
      }}
      maxWidth="xl"
    >
      <Box id="editorial-1j1s-content-container" tabIndex={-1} sx={{ px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 } }}>
        <Box sx={{ display: "flex", gap: { xs: fr.spacing("2v"), md: fr.spacing("13v") }, flexDirection: { xs: "column", md: "row" }, marginTop: fr.spacing("4v") }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "start" }}>
            <Box>
              <Typography component={"h1"} sx={{ fontSize: { xs: "32px", md: "40px" }, fontWeight: 700, lineHeight: { xs: "40px", md: "48px" } }}>
                LES APPRENTIS SONT TOUS DIFFÉRENTS !
              </Typography>
              <Typography sx={{ fontSize: "20px", mt: fr.spacing("6v") }}>Trouvez votre future recrue avec 1jeune1solution et La bonne alternance.</Typography>
              <Typography component={"h2"} sx={{ fontSize: { xs: "28px", md: "32px" }, fontWeight: 700, lineHeight: { xs: "36px", md: "40px" }, mt: fr.spacing("6v") }}>
                Publier une offre en alternance
              </Typography>
              <Typography sx={{ fontSize: "20px", mt: fr.spacing("6v") }}>Pour démarrer, recherchez le nom ou le SIRET de votre entreprise :</Typography>
              <CreationCompteForm
                organisationType={AUTHTYPE.ENTREPRISE}
                setBandeau={setBandeau}
                origin="1Jeune1Solution"
                isWidget={false}
                onSelectOrganisation={onSelectOrganisation}
              />
            </Box>
          </Box>
          <Box sx={{ display: { xs: "none", lg: "block" }, flex: 1, "& > img": { maxWidth: "100%", height: "auto" } }}>
            <NextImage src="/images/1j1s/personna.png" alt="" aria-hidden="true" width={567} height={480} unoptimized />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("6v"), px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 }, py: fr.spacing("8v") }}
      >
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/graph.svg" width={89} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" />

          <Typography
            sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, fontSize: "50px", lineHeight: "60px", mt: fr.spacing("6v"), mb: fr.spacing("3v") }}
          >
            3,5 M
          </Typography>
          <Typography sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, lineHeight: "32px", fontSize: "20px", mb: fr.spacing("3v") }}>
            DE VISITEURS
          </Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>Sur La bonne alternance en 2025</Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/heart.svg" width={70} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
          <Typography
            sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, fontSize: "50px", lineHeight: "60px", mt: fr.spacing("6v"), mb: fr.spacing("3v") }}
          >
            200 000
          </Typography>
          <Typography sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, lineHeight: "32px", fontSize: "20px", mb: fr.spacing("3v") }}>
            CANDIDATS
          </Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>postulent aux offres chaque année</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/scroll.svg" width={71} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
          <Typography
            sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, fontSize: "50px", lineHeight: "60px", mt: fr.spacing("6v"), mb: fr.spacing("3v") }}
          >
            30%
          </Typography>
          <Typography sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, lineHeight: "32px", fontSize: "20px", mb: fr.spacing("3v") }}>
            1 APPRENTI SUR 3
          </Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>reste dans l'entreprise qui l'a formé</Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 } }}>
        <Box sx={{ display: "flex", gap: { xs: fr.spacing("2v"), md: fr.spacing("13v") }, flexDirection: { xs: "column-reverse", md: "row" }, marginTop: fr.spacing("4v") }}>
          <Box sx={{ flex: 1, "& > img": { maxWidth: "100%", height: "auto" } }}>
            <NextImage src="/images/1j1s/depot-offre.png" alt="" aria-hidden="true" width={513} height={464} unoptimized />
          </Box>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Box>
              <Typography sx={{ fontSize: "28px", fontWeight: 700, lineHeight: "36px" }}>Postez votre offre d’alternance en quelques secondes</Typography>
              <Typography sx={{ fontSize: "18px", mt: fr.spacing("4v") }}>Sélectionnez le métier sur lequel vous recrutez, nous générons votre offre instantanément.</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: { xs: fr.spacing("2v"), md: fr.spacing("13v") }, flexDirection: { xs: "column", md: "row" }, marginTop: fr.spacing("4v") }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Box>
              <Typography sx={{ fontSize: "28px", fontWeight: 700, lineHeight: "36px" }}>Nous la diffusons gratuitement au plus près des candidats</Typography>
              <Typography sx={{ fontSize: "18px", mt: fr.spacing("4v") }}>
                Elles sont mises en ligne sur les sites les plus visités par les candidats en recherche d’alternance :{" "}
                <span style={{ textDecoration: "underline" }}>La bonne alternance</span>, <span style={{ textDecoration: "underline" }}>France Travail</span>,{" "}
                <span style={{ textDecoration: "underline" }}>Parcoursup</span>, <span style={{ textDecoration: "underline" }}>HelloWork</span> et{" "}
                <span style={{ textDecoration: "underline" }}>bien d’autres</span>.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ flex: 1, "& > img": { maxWidth: "100%", height: "auto" } }}>
            <NextImage src="/images/1j1s/detail-offre.png" alt="" aria-hidden="true" width={626} height={428} unoptimized />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: { xs: fr.spacing("2v"), md: fr.spacing("13v") }, flexDirection: { xs: "column-reverse", md: "row" }, marginTop: fr.spacing("4v") }}>
          <Box sx={{ flex: 1, "& > img": { maxWidth: "100%", height: "auto" } }}>
            <NextImage src="/images/1j1s/candidature.png" alt="" aria-hidden="true" width={383} height={482} unoptimized />
          </Box>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Box>
              <Typography sx={{ fontSize: "28px", fontWeight: 700, lineHeight: "36px" }}>Recevez les profils des candidats dans votre boite mail</Typography>
              <Typography sx={{ fontSize: "18px", mt: fr.spacing("4v") }}>
                Les candidats vous partagent leurs coordonnées et leur CV directement par email, à vous de répondre !
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Social />
    </Container>
  )
}
