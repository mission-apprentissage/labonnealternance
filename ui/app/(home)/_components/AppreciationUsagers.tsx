"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import Image from "next/image"
import { useRef, useState } from "react"

export const AppreciationUsagers = () => {
  const [expanded, setExpanded] = useState(false)
  const firstTestimonyRef = useRef<HTMLDivElement>(null)

  const toggle = () => {
    setExpanded((v) => !v)
    firstTestimonyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <Container sx={{ padding: { xs: fr.spacing("6v"), lg: "0 !important" } }} maxWidth="xl" component="section">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: fr.spacing("10v"),
        }}
      >
        <Typography id="home-content-container" variant="h1">
          Apprécié
          <br />
          <Box component="span" sx={{ color: fr.colors.decisions.border.default.blueFrance.default }}>
            de nos usagers
          </Box>
        </Typography>
        <Box sx={{ width: "13%", height: "4px", background: fr.colors.decisions.border.default.blueFrance.default }} />
        <Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              gap: fr.spacing("8v"),
            }}
          >
            <Box
              ref={firstTestimonyRef}
              sx={{
                flex: 1,
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "#F5F5FE",
                py: { xs: fr.spacing("4v"), md: fr.spacing("10v") },
                px: { xs: fr.spacing("4v"), md: fr.spacing("10v") },
              }}
            >
              <Image src="/images/home_pics/avatars/avatar_femme_01.png" alt="" width={98} height={98} />
              <Typography sx={{ textAlign: "center", fontSize: "14px", fontWeight: 700, lineHeight: "24px", mt: fr.spacing("6v"), mb: fr.spacing("2v") }}>
                Cassandra,
                <br />
                alternante en Licence
                <br />
                Économie Sociale et Familiale (ESF)
              </Typography>
              <Typography sx={{ textAlign: "center" }}>
                "La bonne alternance est un outil très simple d'utilisation avec pas mal d'offres. J'apprécie particulièrement les suggestions de candidatures spontanées, qu'on ne
                retrouve nulle part ailleurs."
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                borderRadius: "8px",
                display: { xs: expanded ? "flex" : "none", lg: "flex" },
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "#F5F5FE",
                py: { xs: fr.spacing("4v"), md: fr.spacing("10v") },
                px: { xs: fr.spacing("4v"), md: fr.spacing("10v") },
              }}
            >
              <Image src="/images/home_pics/avatars/avatar_homme_01.png" alt="" width={98} height={98} />
              <Typography sx={{ textAlign: "center", fontSize: "14px", fontWeight: 700, lineHeight: "24px", mt: fr.spacing("6v"), mb: fr.spacing("2v") }}>
                Simon,
                <br />
                alternant en master
                <br />
                Mention maintenance aéronautique
              </Typography>
              <Typography sx={{ textAlign: "center" }}>
                "La bonne alternance est un service pratique pour candidater, pas besoin de se créer de compte pour envoyer son CV."
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                borderRadius: "8px",
                display: { xs: expanded ? "flex" : "none", lg: "flex" },
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "#F5F5FE",
                py: { xs: fr.spacing("4v"), md: fr.spacing("10v") },
                px: { xs: fr.spacing("4v"), md: fr.spacing("10v") },
              }}
            >
              <Image src="/images/home_pics/avatars/avatar_femme_02.png" alt="" width={98} height={98} />
              <Typography sx={{ textAlign: "center", fontSize: "14px", fontWeight: 700, lineHeight: "24px", mt: fr.spacing("6v"), mb: fr.spacing("2v") }}>
                Lise,
                <br />
                alternante en BTS
                <br />
                Gestion
              </Typography>
              <Typography sx={{ textAlign: "center" }}>"J'ai pu explorer plein de formations et contacter les écoles directement. Ça aide pour bien s'orienter."</Typography>
            </Box>
          </Box>
          <Box sx={{ mt: fr.spacing("4v"), display: "flex", justifyContent: "flex-end" }}>
            <Box
              component="button"
              onClick={toggle}
              sx={{
                display: { xs: "block", lg: "none" },
                alignSelf: "flex-end",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: fr.colors.decisions.text.actionHigh.blueFrance.default,
                fontSize: "14px",
                textDecoration: "underline",
              }}
            >
              {expanded ? "- Voir moins de témoignages" : "+ Voir plus de témoignages"}
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
