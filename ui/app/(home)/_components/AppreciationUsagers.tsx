"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { useRef, useState } from "react"
import { SectionTitle } from "@/app/_components/Title/SectionTitle"

type Testimony = {
  avatar: string
  name: string
  role: string
  quote: string
}

const TESTIMONIES: Record<"recruteur" | "cfa", [Testimony, Testimony, Testimony]> = {
  recruteur: [
    {
      avatar: "/images/home_pics/avatars/recruteur_01.png",
      name: "Philippe",
      role: "Gérant de commerce",
      quote:
        "“La bonne alternance est un outil qui me facilite mes recrutements en alternance, moi qui n’ai pas le temps de rédiger des fiches de poste... Je reçois ensuite les candidatures directement dans ma boîte mail.”",
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
  realm: "recruteur" | "cfa"
}

export const AppreciationUsagers = ({ realm }: Props) => {
  const [expanded, setExpanded] = useState(false)
  const firstTestimonyRef = useRef<HTMLLIElement>(null)

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
      <SectionTitle id="apprecie-de-nos-usagers" highlight="de nos usagers">
        Apprécié
      </SectionTitle>
      <Box>
        <Box
          component="ul"
          className="fr-raw-list"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: fr.spacing("8v"),
          }}
        >
          {testimonies.map((testimony, index) => (
            <Box
              component="li"
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
              <Box component="figure" sx={{ m: 0 }}>
                <Typography component="figcaption" sx={{ textAlign: "center", fontSize: "14px", fontWeight: 700, lineHeight: "24px", mt: fr.spacing("6v"), mb: fr.spacing("2v") }}>
                  {testimony.name},
                  <br />
                  {testimony.role.split("\n").map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </Typography>
                <Typography component="blockquote" sx={{ textAlign: "center" }}>
                  {testimony.quote}
                </Typography>
              </Box>
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
