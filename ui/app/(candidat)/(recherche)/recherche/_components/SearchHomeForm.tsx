"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import { Box, ButtonBase } from "@mui/material"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { RechercheFormTitle } from "@/app/_components/RechercheForm/RechercheFormTitle"
import { MATOMO_EVENTS, pushMatomoEvent, SEARCH_ENGINES } from "@/utils/matomo-utils"

import type { QSource, SearchMode } from "../_utils/search.params.utils"
import { buildSearchUrl, DEFAULT_SEARCH_MODE } from "../_utils/search.params.utils"
import { searchTypeOf } from "../_utils/search.tracking.utils"
import { SearchBar } from "./SearchBar"
import { SearchMobilePanel } from "./SearchMobilePanel"
import { SEARCH_MODE_OPTIONS, SearchTypeRechercheSelect } from "./SearchTypeRechercheSelect"

type Lieu = { label: string; latitude: number; longitude: number; adminArea?: string }

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
        // Collé au bouton loupe (groupe champ + bouton) : coins droits à plat, pas de
        // bordure droite (le bouton plein prend le relais).
        borderRight: "none",
        borderRadius: "4px 0 0 4px",
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
 * Formulaire du nouveau moteur sur la page d'accueil (utilisateurs ayant opté pour la nouvelle
 * version) : champs + type de recherche, sans filtres. La recherche part vers /recherche au clic
 * sur Rechercher ou sur Entrée liste fermée ; accepter une option métier ne fait que remplir le
 * champ (cf. handleQChange). En mobile, la saisie passe par une modale plein écran ouverte par
 * un faux champ, pour garder les suggestions au-dessus du clavier.
 */
export function SearchHomeForm({ id }: { id: string }) {
  const router = useRouter()
  const [q, setQ] = useState("")
  // Source de la valeur du champ métier pour la télémétrie ("suggestion" si elle vient
  // d'une sélection dans l'autocomplete, "free_text" dès que l'utilisateur retape).
  const [qSource, setQSource] = useState<QSource>("free_text")
  const [lieu, setLieu] = useState<Lieu | null>(null)
  const [mode, setMode] = useState<SearchMode>(DEFAULT_SEARCH_MODE)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  // Champ (métier/lieu) en cours de saisie dans la modale : SearchBar passe en « écran de
  // saisie » (suggestions inline plein écran) — le reste du formulaire est masqué.
  const [mobileFieldActive, setMobileFieldActive] = useState(false)

  const closeMobilePanel = () => {
    setMobilePanelOpen(false)
    // La modale peut se fermer pendant une saisie (croix, Escape) : sans reset, la
    // prochaine ouverture masquerait type de recherche et bouton.
    setMobileFieldActive(false)
  }

  // Retour sur la home après une recherche : formulaire vierge, comme après un montage à neuf.
  // Selon le chemin de navigation, cacheComponents remonte la home ou réaffiche l'instance
  // conservée (<Activity> masquée) avec tout son état. Les effets d'une Activity masquée sont
  // rejoués au réaffichage : c'est le signal de retour, pris en compte seulement après un
  // lancement (searchLaunched). SearchBar (desktop) garde sa saisie en interne : le changement
  // de key la remonte.
  const [formKey, setFormKey] = useState(0)
  const searchLaunched = useRef(false)
  useEffect(() => {
    if (!searchLaunched.current) return
    searchLaunched.current = false
    setQ("")
    setQSource("free_text")
    setLieu(null)
    setMode(DEFAULT_SEARCH_MODE)
    setFormKey((k) => k + 1)
  }, [])

  const launchSearch = (query: string, source: QSource) => {
    // cacheComponents (<Activity>) garde cette instance montée — pas démontée — pendant la
    // navigation : sans fermeture explicite, la modale serait encore ouverte en revenant
    // sur l'accueil (logo LBA, bouton retour).
    closeMobilePanel()
    searchLaunched.current = true
    // Même événement que le formulaire home legacy, enrichi de search_engine.
    pushMatomoEvent({
      event: MATOMO_EVENTS.SEARCH_LAUNCHED,
      search_job_name: query.trim() || "non_renseigné",
      search_address: lieu?.label || "non_renseigné",
      search_admin_area: lieu?.adminArea ?? "non_renseigné",
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
        admin_area: lieu?.adminArea,
        mode,
        radius: 20,
        page: 0,
        hitsPerPage: 20,
      })
    )
  }

  /* Une option métier acceptée (Entrée, clic), saisie libre comme suggestion, ne fait que
     remplir le champ : l'usager renseigne ensuite le lieu et le type d'offre (issue #5508).
     Entrée ne lance que liste fermée (soumission implicite). */
  const handleQChange = (value: string, source: QSource) => {
    setQ(value)
    setQSource(source)
  }

  // Même événement que le sélecteur de la page de résultats.
  const handleModeChange = (newMode: SearchMode) => {
    pushMatomoEvent({ event: MATOMO_EVENTS.SEARCH_TYPE_CHANGED, search_type: searchTypeOf(newMode), search_engine: SEARCH_ENGINES.BETA })
    setMode(newMode)
  }

  return (
    <Box
      id={id}
      // Cible du lien d'évitement « Recherche » (voir ui/app/(home)/layout.tsx) : sans
      // tabindex="-1" le navigateur scrolle jusqu'ici mais laisse le focus sur le lien.
      tabIndex={-1}
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

      {/* Tablette et Mobile : faux champ + bouton loupe → modale plein écran (métier, lieu, type de recherche). */}
      <Box aria-hidden={true} sx={{ display: { xs: "block", lg: "none" } }}>
        <Box component="span" sx={{ display: "block", fontSize: "1rem", fontWeight: 700, color: fr.colors.decisions.text.default.grey.default, mb: fr.spacing("1v") }}>
          Que recherchez-vous ?
        </Box>
        {/* minWidth 0 sur la rangée ET le wrapper flex du faux champ : sans eux, le contenu
            nowrap impose sa largeur min → le champ déborde de l'écran. */}
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MobileFakeField value={q} onOpen={() => setMobilePanelOpen(true)} />
          </Box>
          <Button
            priority="primary"
            iconId="fr-icon-search-line"
            title="Ouvrir la recherche"
            aria-haspopup="dialog"
            onClick={() => setMobilePanelOpen(true)}
            // Hauteur DSFR icône-seule plafonnée à 2.5rem (max-height) → déplafonnée en
            // inline pour s'aligner sur les 48px du champ. La largeur garde le plafond
            // DSFR (2.5rem).
            style={{ height: 48, maxHeight: 48, flexShrink: 0, borderRadius: "0 4px 4px 0" }}
          />
        </Box>
      </Box>

      {/* Grand écran : rangée champs + type de recherche + bouton. */}
      <Box sx={{ display: { xs: "none", lg: "flex" }, flexDirection: "row", gap: fr.spacing("3v"), alignItems: "flex-end" }}>
        <Box sx={{ flex: 1 }}>
          <SearchBar key={formKey} layout="row" onSubmit={launchSearch} onQChange={handleQChange} onLieuChange={setLieu} />
        </Box>
        <SearchTypeRechercheSelect value={mode} onChange={handleModeChange} />
        {/* Même hauteur que les champs (48px — le bouton DSFR fait 40px par défaut). */}
        <Button priority="primary" iconId="fr-icon-search-line" onClick={() => launchSearch(q, qSource)} style={{ height: 48, justifyContent: "center" }}>
          Rechercher
        </Button>
      </Box>

      {/* Même design que la modale de la page de résultats (SearchPageClient, panel "search") ;
          seul le comportement diffère : ici le bouton lance la recherche (application différée). */}
      {mobilePanelOpen && (
        <SearchMobilePanel title="Votre recherche" hideHeader={mobileFieldActive} onClose={closeMobilePanel}>
          {/* height 100% pendant la saisie : les suggestions inline de SearchBar remplissent
              l'espace du panneau (borné au viewport visible, donc au-dessus du clavier). */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v"), height: mobileFieldActive ? "100%" : undefined }}>
            <SearchBar
              key={formKey}
              layout="column"
              inlineSuggestions
              onActiveFieldChange={(field) => setMobileFieldActive(field !== null)}
              initialQ={q}
              initialLieuLabel={lieu?.label}
              onSubmit={launchSearch}
              onQChange={handleQChange}
              onLieuChange={setLieu}
            />
            {/* Masqués pendant la saisie : l'écran est réservé au champ actif + suggestions. */}
            {!mobileFieldActive && (
              <>
                <RadioButtons
                  legend="Type de recherche"
                  options={SEARCH_MODE_OPTIONS.map((option) => ({
                    label: option.label,
                    hintText: option.hint,
                    nativeInputProps: { checked: mode === option.value, onChange: () => handleModeChange(option.value) },
                  }))}
                />
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: fr.spacing("4v") }}>
                  <Button priority="primary" iconId="fr-icon-search-line" onClick={() => launchSearch(q, qSource)} style={{ width: "100%", justifyContent: "center" }}>
                    Rechercher
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </SearchMobilePanel>
      )}
    </Box>
  )
}
