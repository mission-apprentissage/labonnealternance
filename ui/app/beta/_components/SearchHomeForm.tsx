"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import { Box, ButtonBase, Divider } from "@mui/material"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { RechercheFormTitle } from "@/app/_components/RechercheForm/RechercheFormTitle"
import { MATOMO_EVENTS, pushMatomoEvent, SEARCH_ENGINES } from "@/utils/matomoUtils"

import type { QSource, SearchMode } from "../_utils/search.params.utils"
import { buildSearchUrl, DEFAULT_SEARCH_MODE } from "../_utils/search.params.utils"
import { searchTypeOf } from "../_utils/search.tracking.utils"
import { ExitNewSearchLink } from "./ExitNewSearchLink"
import { SearchBar } from "./SearchBar"
import { SearchMobilePanel } from "./SearchMobilePanel"
import { SEARCH_MODE_OPTIONS, SearchTypeRechercheSelect } from "./SearchTypeRechercheSelect"

type Lieu = { label: string; latitude: number; longitude: number }

// Placeholder court du faux champ (cf. design mobile) — le champ réel de la modale garde
// le placeholder long de SearchBar.
const FAKE_FIELD_PLACEHOLDER = "Recherche par mot clé"

/**
 * Faux champ de la home mobile : même rendu que le champ métier de SearchBar, mais un simple
 * bouton qui ouvre la modale de saisie plein écran — au milieu de page, le dropdown de
 * suggestions serait masqué par le clavier virtuel.
 */
function MobileFakeField({ value, onOpen }: { value?: string; onOpen: () => void }) {
  return (
    <ButtonBase
      onClick={onOpen}
      aria-haspopup="dialog"
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        textAlign: "left",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        minHeight: 48,
        px: "14px",
        backgroundColor: "#FFFFFF",
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        borderRadius: "4px",
        fontSize: "1rem",
        color: value ? fr.colors.decisions.text.default.grey.default : fr.colors.decisions.text.mention.grey.default,
        "&:focus-visible": { outline: "2px solid #0a76f6", outlineOffset: 2 },
      }}
    >
      {/* minWidth 0 : sans lui, l'enfant flex ne rétrécit pas sous la largeur du texte
          nowrap → débordement horizontal de la page en mobile (l'ellipsis ne s'applique jamais). */}
      <Box component="span" sx={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value || FAKE_FIELD_PLACEHOLDER}
      </Box>
    </ButtonBase>
  )
}

/**
 * Formulaire du nouveau moteur affiché sur la page d'accueil pour les utilisateurs ayant
 * opté pour la nouvelle version : champs + type de recherche, SANS filtres (cf. Figma).
 * State local — la recherche ne part vers /beta/recherche qu'au clic sur le bouton
 * Rechercher (Entrée et la sélection d'une suggestion ne font que remplir le champ).
 * En mobile, la saisie passe par une modale plein écran ouverte par un faux champ —
 * champ ancré en haut, suggestions visibles au-dessus du clavier.
 */
export function SearchHomeForm() {
  const router = useRouter()
  const [q, setQ] = useState("")
  // Source de la valeur du champ métier pour la télémétrie ("suggestion" si elle vient
  // d'une sélection dans l'autocomplete, "free_text" dès que l'utilisateur retape).
  const [qSource, setQSource] = useState<QSource>("free_text")
  const [lieu, setLieu] = useState<Lieu | null>(null)
  const [mode, setMode] = useState<SearchMode>(DEFAULT_SEARCH_MODE)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)

  const launchSearch = (query: string, source: QSource) => {
    // Même événement que le formulaire home legacy, enrichi de search_engine.
    pushMatomoEvent({
      event: MATOMO_EVENTS.SEARCH_LAUNCHED,
      search_job_name: query.trim() || "non_renseigné",
      search_address: lieu?.label || "non_renseigné",
      search_radius: 20,
      search_diploma: "indifferent",
      search_origin: "page_accueil",
      search_engine: SEARCH_ENGINES.BETA,
      q_source: source,
    })
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

  /* Comportement voulu (07/2026, susceptible d'évoluer) : Entrée ou la sélection d'une
     suggestion REMPLIT le champ métier sans déclencher la recherche — seul le bouton
     Rechercher lance la navigation. Pour revenir au lancement direct, rebrancher
     launchSearch sur onSubmit. */
  const fillQ = (query: string, source: QSource) => {
    setQ(query)
    setQSource(source)
  }
  const handleQChange = (value: string) => {
    setQ(value)
    setQSource("free_text")
  }

  // Même événement que le sélecteur de la page de résultats (spec tracking filtres).
  const handleModeChange = (newMode: SearchMode) => {
    pushMatomoEvent({ event: MATOMO_EVENTS.SEARCH_TYPE_CHANGED, search_type: searchTypeOf(newMode), search_engine: SEARCH_ENGINES.BETA })
    setMode(newMode)
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

      {/* Mobile : faux champ + bouton loupe → modale plein écran (métier, lieu, type de recherche). */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Box component="span" sx={{ display: "block", fontSize: "1rem", fontWeight: 700, color: fr.colors.decisions.text.default.grey.default, mb: fr.spacing("1v") }}>
          Que recherchez-vous ?
        </Box>
        {/* minWidth 0 sur la rangée ET le wrapper flex du faux champ : sans eux, le contenu
            nowrap impose sa largeur min → le champ déborde de l'écran. */}
        <Box sx={{ display: "flex", gap: fr.spacing("2v"), minWidth: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MobileFakeField value={q} onOpen={() => setMobilePanelOpen(true)} />
          </Box>
          <Button
            priority="primary"
            iconId="fr-icon-search-line"
            title="Ouvrir la recherche"
            aria-haspopup="dialog"
            onClick={() => setMobilePanelOpen(true)}
            style={{ height: 48, flexShrink: 0 }}
          />
        </Box>
      </Box>

      {/* Desktop : rangée champs + type de recherche + bouton. */}
      <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "row", gap: fr.spacing("3v"), alignItems: "flex-end" }}>
        <Box sx={{ flex: 1 }}>
          <SearchBar layout="row" onSubmit={fillQ} onQChange={handleQChange} onLieuChange={setLieu} />
        </Box>
        <SearchTypeRechercheSelect value={mode} onChange={handleModeChange} />
        {/* Même hauteur que les champs (48px — le bouton DSFR fait 40px par défaut). */}
        <Button priority="primary" iconId="fr-icon-search-line" onClick={() => launchSearch(q, qSource)} style={{ height: 48, justifyContent: "center" }}>
          Rechercher
        </Button>
      </Box>

      <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
        <ExitNewSearchLink navigateToLegacy={false} />
      </Box>

      {mobilePanelOpen && (
        <SearchMobilePanel ariaLabel="Votre recherche" onClose={() => setMobilePanelOpen(false)}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
            <SearchBar layout="column" initialQ={q} initialLieuLabel={lieu?.label} onSubmit={fillQ} onQChange={handleQChange} onLieuChange={setLieu} />
            <Divider />
            <RadioButtons
              legend="Type de recherche"
              options={SEARCH_MODE_OPTIONS.map((option) => ({
                label: option.label,
                hintText: option.hint,
                nativeInputProps: { checked: mode === option.value, onChange: () => handleModeChange(option.value) },
              }))}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button priority="primary" iconId="fr-icon-search-line" onClick={() => launchSearch(q, qSource)}>
                Rechercher
              </Button>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
              <ExitNewSearchLink navigateToLegacy={false} />
            </Box>
          </Box>
        </SearchMobilePanel>
      )}
    </Box>
  )
}
