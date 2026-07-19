"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { RechercheFormTitle } from "@/app/_components/RechercheForm/RechercheFormTitle"

import type { QSource, SearchMode } from "../_utils/search.params.utils"
import { buildSearchUrl, DEFAULT_SEARCH_MODE } from "../_utils/search.params.utils"
import { ExitNewSearchLink } from "./ExitNewSearchLink"
import { SearchBar } from "./SearchBar"
import { SearchTypeRechercheSelect } from "./SearchTypeRechercheSelect"

type Lieu = { label: string; latitude: number; longitude: number }

/**
 * Formulaire du nouveau moteur affiché sur la page d'accueil pour les utilisateurs ayant
 * opté pour la nouvelle version : champs + type de recherche, SANS filtres (cf. Figma).
 * State local — la recherche ne part vers /search/split qu'au submit (bouton, Entrée ou
 * sélection d'une suggestion).
 */
export function SearchHomeForm() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [lieu, setLieu] = useState<Lieu | null>(null)
  const [mode, setMode] = useState<SearchMode>(DEFAULT_SEARCH_MODE)

  const launchSearch = (query: string, source: QSource) => {
    router.push(
      buildSearchUrl({
        q: query.trim() || undefined,
        q_source: query.trim() ? source : undefined,
        lieu_label: lieu?.label,
        latitude: lieu?.latitude,
        longitude: lieu?.longitude,
        mode,
        radius: 20,
        page: 0,
        hitsPerPage: 20,
      })
    )
  }

  return (
    <Box
      sx={{
        padding: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("4v"),
        borderRadius: { xs: 0, md: fr.spacing("2v") },
        boxShadow: "0px 2px 6px 0px #00001229",
      }}
    >
      <RechercheFormTitle />
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("3v"), alignItems: { xs: "stretch", md: "flex-end" } }}>
        <Box sx={{ flex: 1 }}>
          <SearchBar layout="responsive" onSubmit={launchSearch} onQChange={setQ} onLieuChange={setLieu} />
        </Box>
        <SearchTypeRechercheSelect value={mode} onChange={setMode} />
        <Button priority="primary" iconId="fr-icon-search-line" onClick={() => launchSearch(q, "free_text")}>
          Rechercher
        </Button>
      </Box>
      <Box sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-end" } }}>
        <ExitNewSearchLink navigateToLegacy={false} />
      </Box>
    </Box>
  )
}
