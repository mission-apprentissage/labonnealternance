"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { CSSProperties, useState } from "react"

import { RechercheCarte } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap"
import { RechercheResultatsList } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheResultatsList"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

const containerStyle: CSSProperties = {
  height: "100%",
  flex: 1,
}

export function RechercheResultats(props: WithRecherchePageParams) {
  return (
    <>
      <Box
        sx={{
          ...containerStyle,
          display: {
            xs: "none",
            md: "block",
          },
        }}
      >
        <RechercheResultatsDesktop {...props} />
      </Box>
      <Box
        sx={{
          ...containerStyle,
          display: {
            xs: "block",
            md: "none",
          },
        }}
      >
        <RechercheResultatsMobile {...props} />
      </Box>
    </>
  )
}

function RechercheResultatsDesktop(props: WithRecherchePageParams) {
  return (
    <Box sx={{ display: "flex", flex: 1, height: "100%" }}>
      <RechercheResultatsList {...props} />
      {props.params.displayMap && <RechercheCarte item={null} variant="recherche" {...props} />}
    </Box>
  )
}

function RechercheResultatsMobile(props: WithRecherchePageParams) {
  const [mobileMode, setMobileMode] = useState<"list" | "map">("list")

  const toggleMobileMode = () => {
    setMobileMode((mode) => (mode === "list" ? "map" : "list"))
  }

  const displayList = mobileMode === "list"

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {displayList ? <RechercheResultatsList {...props} /> : <RechercheCarte item={null} variant="recherche" {...props} />}
      <Box
        sx={{
          padding: fr.spacing("2w"),
          margin: "auto",
        }}
      >
        <Button onClick={toggleMobileMode} iconId={displayList ? "fr-icon-map-pin-2-line" : "fr-icon-list-unordered"}>
          {displayList ? "Carte" : "Liste"}
        </Button>
      </Box>
    </Box>
  )
}
