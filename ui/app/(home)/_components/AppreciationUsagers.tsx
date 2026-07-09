"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { useRef, useState } from "react"

type Testimony = {
  avatar: string
  name: string
  role: string
  quote: string
}

const TESTIMONIES: Record<"candidat" | "recruteur" | "cfa", [Testimony, Testimony, Testimony]> = {
  candidat: [
    {
      avatar: "/images/home_pics/avatars/avatar_femme_01.png",
      name: "Cassandra",
      role: "alternante en Licence\nÉconomie Sociale et Familiale (ESF)",
      quote:
        "“La bonne alternance est un outil très simple d'utilisation avec pas mal d'offres. J'apprécie particulièrement les suggestions de candidatures spontanées, qu'on ne retrouve nulle part ailleurs.“",
    },
    {
      avatar: "/images/home_pics/avatars/avatar_homme_01.png",
      name: "Simon",
      role: "alternant en master\nMention maintenance aéronautique",
      quote: "“La bonne alternance est un service pratique pour candidater, pas besoin de se créer de compte pour envoyer son CV.“",
    },
    {
      avatar: "/images/home_pics/avatars/avatar_femme_02.png",
      name: "Lise",
      role: "alternante en BTS\nGestion",
      quote: "“J'ai pu explorer plein de formations et contacter les écoles directement. Ça aide pour bien s'orienter.“",
    },
  ],
  recruteur: [
    {
      avatar: "/images/home_pics/avatars/recruteur_01.png",
      name: "Philippe",
      role: "Gérant de commerce",
      quote:
        "“La bonne alternance est un outil qui me facilite mes recrutements en alternance, moi qui n’ai pas le temps de rédiger des fiches de poste... Je reçois ensuite les candidatures directement dans ma boîte mail.“",
    },
    {
      avatar: "/images/home_pics/avatars/recruteur_02.png",
      name: "Fabien",
      role: "Entrepreneur",
      quote: "“La bonne alternance est un outil gratuit qui me facilite le sourcing de candidats.”",
    },
    {
      avatar: "/images/home_pics/avatars/recruteur_03.png",
      name: "Myriam",
      role: "RH",
      quote: "“Notre entreprise recrute chaque année des alternants. La bonne alternance est un outil que nous utilisons systématiquement pour atteindre les jeunes.”",
    },
  ],
  cfa: [
    {
      avatar: "/images/home_pics/avatars/cfa_01.png",
      name: "Stéphane",
      role: "Directeur Fondateur d’un CFA",
      quote:
        "“On reçoit les candidatures directement dans notre boîte mail. On ne peut pas les rater. On peut aussi donner la main à tout le monde. Une bonne expérience, presque mieux qu' Indeed !”",
    },
    {
      avatar: "/images/home_pics/avatars/cfa_02.png",
      name: "Norah",
      role: "Responsable entreprises d’un CFA",
      quote: "“Les entreprises à proximité de notre CFA peuvent nous partager leurs besoins en recrutement. C’est très utile pour nos étudiants.”",
    },
    {
      avatar: "/images/home_pics/avatars/cfa_03.png",
      name: "Marc",
      role: "Responsable partenariat d’un CFA",
      quote:
        "“La bonne alternance est un service dont on fait la promotion à nos étudiants. C’est un outil précieux pour qu’ils puissent identifier les entreprises de notre secteur.”",
    },
  ],
}

type Props = {
  realm: "candidat" | "recruteur" | "cfa"
}

export const AppreciationUsagers = ({ realm }: Props) => {
  const [expanded, setExpanded] = useState(false)
  const firstTestimonyRef = useRef<HTMLDivElement>(null)

  const toggle = () => {
    setExpanded((v) => !v)
    firstTestimonyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const testimonies = TESTIMONIES[realm]

  return (
    <Box
      sx={{
        paddingY: { xs: fr.spacing("6v"), lg: "0 !important" },
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
      <Box sx={{ width: "13%", minWidth: "80px", height: "4px", background: fr.colors.decisions.border.default.blueFrance.default }} />
      <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: fr.spacing("8v"),
          }}
        >
          {testimonies.map((testimony, index) => (
            <Box
              key={index}
              ref={index === 0 ? firstTestimonyRef : undefined}
              sx={{
                flex: 1,
                borderRadius: "8px",
                display: index === 0 ? "flex" : { xs: expanded ? "flex" : "none", lg: "flex" },
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "#F5F5FE",
                py: { xs: fr.spacing("4v"), md: fr.spacing("10v") },
                px: { xs: fr.spacing("4v"), md: fr.spacing("10v") },
              }}
            >
              <Image src={testimony.avatar} alt="" width={98} height={98} />
              <Typography sx={{ textAlign: "center", fontSize: "14px", fontWeight: 700, lineHeight: "24px", mt: fr.spacing("6v"), mb: fr.spacing("2v") }}>
                {testimony.name},
                <br />
                {testimony.role.split("\n").map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </Typography>
              <Typography sx={{ textAlign: "center" }}>{testimony.quote}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ mt: fr.spacing("4v"), display: "flex", justifyContent: "flex-end" }}>
          <Box
            component="button"
            type="button"
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
  )
}
