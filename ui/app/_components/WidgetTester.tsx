"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, FormLabel, Input, Stack, Typography } from "@mui/material"
import { useState } from "react"
import { SearchBar } from "@/app/(candidat)/(recherche)/recherche/_components/SearchBar"
import { SearchTypeRechercheSelect } from "@/app/(candidat)/(recherche)/recherche/_components/SearchTypeRechercheSelect"
import type { QSource, SearchMode } from "@/app/(candidat)/(recherche)/recherche/_utils/search.params.utils"
import { buildSearchUrl, DEFAULT_SEARCH_MODE } from "@/app/(candidat)/(recherche)/recherche/_utils/search.params.utils"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { baseUrl } from "@/config/config"

type Lieu = { label: string; latitude: number; longitude: number }

const WidgetIFrame = ({ title, width, height, url }: { title: string; width?: number; height: number; url: string }) => {
  return (
    <iframe
      title={title}
      style={{
        marginTop: "30px",
        marginBottom: "30px",
        height: `${height}px`,
        width: width ? `${width}px` : "100%",
      }}
      src={url}
    />
  )
}

export function WidgetTester() {
  const [q, setQ] = useState("")
  const [qSource, setQSource] = useState<QSource>("free_text")
  const [lieu, setLieu] = useState<Lieu | null>(null)
  const [mode, setMode] = useState<SearchMode>(DEFAULT_SEARCH_MODE)
  const [caller, setCaller] = useState("")

  const [widgetUrl, setWidgetUrl] = useState(`${baseUrl}/recherche`)

  const refreshWidgets = () => {
    const path = buildSearchUrl({
      q: q.trim() || undefined,
      q_source: q.trim() ? qSource : undefined,
      lieu_label: lieu?.label,
      latitude: lieu?.latitude,
      longitude: lieu?.longitude,
      mode,
      radius: 20,
      page: 0,
      hitsPerPage: 20,
    })
    const url = new URL(`${baseUrl}${path}`)
    if (caller) url.searchParams.append("caller", caller)
    setWidgetUrl(url.toString())
  }

  return (
    <Box sx={{ p: fr.spacing("6v"), backgroundColor: "#f8f8f8" }}>
      <Typography variant="h1" sx={{ mb: fr.spacing("4v") }}>
        Test du Widget La bonne alternance
      </Typography>
      <Typography sx={{ mb: fr.spacing("4v") }}>
        Lien vers la documentation détaillé :{" "}
        <DsfrLink href="https://www.data.gouv.fr/fr/dataservices/api-la-bonne-alternance/" aria-label="Accès à la documentation - nouvelle fenêtre" external={true}>
          https://www.data.gouv.fr/fr/dataservices/api-la-bonne-alternance/
        </DsfrLink>
      </Typography>
      <Stack spacing={2}>
        <SearchBar
          layout="column"
          initialQ={q}
          initialLieuLabel={lieu?.label}
          onSubmit={(value, source) => {
            setQ(value)
            setQSource(source)
          }}
          onQChange={setQ}
          onLieuChange={setLieu}
        />
        <SearchTypeRechercheSelect value={mode} onChange={setMode} fullWidth />
        <FormLabel htmlFor="caller">Identifiant appelant (caller)</FormLabel>
        <Input onChange={(e) => setCaller(e.target.value)} id="caller" name="caller" type="text" placeholder="ex: nom_site" className={fr.cx("fr-input")} />
        <Button type="button" title="Rafraîchir les widgets" onClick={refreshWidgets}>
          Rafraîchir les widgets
        </Button>
      </Stack>
      <Box sx={{ p: fr.spacing("6v"), backgroundColor: fr.colors.decisions.background.altOverlap.grey.active, my: fr.spacing("6v") }}>
        <Typography sx={{ textAlign: "center" }}>
          URL associée à l&apos;attribut{" "}
          <Typography component={"span"} sx={{ fontWeight: 700 }}>
            src
          </Typography>{" "}
          de l&apos;iframe :<br />
          <br />
          <Typography component={"span"} sx={{ fontWeight: 700 }}>
            {widgetUrl}
          </Typography>
        </Typography>
      </Box>
      <hr />
      <Typography variant="h3">Largeur 360 px - hauteur 640 px</Typography>
      <WidgetIFrame title="mobile" height={640} width={360} url={widgetUrl} />
      <hr />
      <Typography variant="h3">Largeur 100% - hauteur 800 px</Typography>
      <WidgetIFrame title="desktop" height={800} url={widgetUrl} />
    </Box>
  )
}
