"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useCallback, useState } from "react"

import { RechercheCarte } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap"
import { RechercheResultatsList } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheResultatsList"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

function RechercheResultatsMobile(props: WithRecherchePageParams) {
  // Mode is only used for mobile view
  const [mode, setMode] = useState<"list" | "map">("list")

  const toggleMode = useCallback(() => {
    setMode((prevMode) => (prevMode === "map" ? "list" : "map"))
  }, [])

  const activeMode = mode === "map" ? "map" : "list"

  return (
    <Box
      sx={{
        display: { xs: "grid", md: "none" },
        gridTemplateRows: "1fr min-content",
        overflow: "hidden",
      }}
    >
      {activeMode === "list" ? <RechercheResultatsList {...props} /> : <RechercheCarte item={null} variant="recherche" {...props} />}
      <Box sx={{ p: fr.spacing("2w"), display: "flex", justifyContent: "center" }}>
        <Button onClick={toggleMode} iconId={mode === "list" ? "fr-icon-map-pin-2-line" : "fr-icon-list-unordered"}>
          {mode === "list" ? "Carte" : "Liste"}
        </Button>
      </Box>
    </Box>
  )
}

function RechercheResultatsDesktop(props: WithRecherchePageParams) {
  return (
    <Box
      sx={{
        display: { xs: "none", md: "grid" },
        gridTemplateColumns: props.params.displayMap ? "1fr 1fr" : "1fr",
        overflow: "hidden",
      }}
    >
      <RechercheResultatsList {...props} />
      {props.params.displayMap && <RechercheCarte item={null} variant="recherche" {...props} />}
    </Box>
  )
}

export function RechercheResultats(props: WithRecherchePageParams) {
  return (
    <>
      <RechercheResultatsDesktop {...props} />
      <RechercheResultatsMobile {...props} />
    </>
  )
}
