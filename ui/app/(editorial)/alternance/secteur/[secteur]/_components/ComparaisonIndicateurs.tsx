import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

type Indicateur = {
  libelle?: string
  valeur_secteur?: number
  valeur_reference?: number
  libelle_reference?: string
  unite?: string
  source_libelle?: string
  source_url?: string
  annee?: number
}

const formatValeur = (valeur: number, unite: string) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(valeur)}${unite ? ` ${unite}` : ""}`

// Couleur du secteur = bleu France, référence = gris neutre : la référence n'est pas une seconde série, c'est un repère.
const SECTEUR_COLOR = fr.colors.decisions.background.actionHigh.blueFrance.default
const REFERENCE_COLOR = fr.colors.decisions.background.contrast.grey.default
const TRACK_COLOR = fr.colors.decisions.background.default.grey.hover

function Barre({ label, valeur, max, unite, color }: { label: string; valeur: number; max: number; unite: string; color: string }) {
  const width = max > 0 ? Math.max((valeur / max) * 100, 1) : 0
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 12rem) minmax(0, 1fr) 5rem" },
        alignItems: "center",
        gap: { xs: fr.spacing("1v"), sm: fr.spacing("3v") },
      }}
    >
      <Typography sx={{ fontSize: "0.875rem", color: fr.colors.decisions.text.default.grey.default }}>{label}</Typography>
      <Box aria-hidden="true" sx={{ height: "12px", backgroundColor: TRACK_COLOR, borderRadius: "0 4px 4px 0" }}>
        <Box sx={{ height: "100%", width: `${width}%`, backgroundColor: color, borderRadius: "0 4px 4px 0" }} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: fr.colors.decisions.text.title.grey.default }}>{formatValeur(valeur, unite)}</Typography>
    </Box>
  )
}

export function ComparaisonIndicateurs({ secteur, indicateurs }: { secteur: string; indicateurs: Indicateur[] }) {
  const label = secteur.charAt(0).toUpperCase() + secteur.slice(1)

  return (
    <Box component="figure" sx={{ m: 0, mt: fr.spacing("6v") }}>
      <Box sx={{ display: "flex", gap: fr.spacing("4v"), flexWrap: "wrap", mb: fr.spacing("4v") }} aria-hidden="true">
        {[
          { nom: label, color: SECTEUR_COLOR },
          { nom: "Référence", color: REFERENCE_COLOR },
        ].map((entree) => (
          <Box key={entree.nom} sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v") }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "2px", backgroundColor: entree.color }} />
            <Typography sx={{ fontSize: "0.875rem" }}>{entree.nom}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("6v") }} aria-hidden="true">
        {indicateurs.map((indicateur) => {
          const max = Math.max(indicateur.valeur_secteur ?? 0, indicateur.valeur_reference ?? 0) * 1.1
          return (
            <Box key={indicateur.libelle}>
              <Typography sx={{ fontWeight: 700, mb: fr.spacing("2v") }}>{indicateur.libelle}</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("2v") }}>
                <Barre label={label} valeur={indicateur.valeur_secteur ?? 0} max={max} unite={indicateur.unite ?? ""} color={SECTEUR_COLOR} />
                <Barre
                  label={indicateur.libelle_reference ?? "Référence"}
                  valeur={indicateur.valeur_reference ?? 0}
                  max={max}
                  unite={indicateur.unite ?? ""}
                  color={REFERENCE_COLOR}
                />
              </Box>
            </Box>
          )
        })}
      </Box>

      {/* Équivalent textuel du graphique (RGAA 1.8) : les barres sont masquées aux technologies d'assistance. */}
      <table className="fr-sr-only">
        <caption>Comparaison des indicateurs du secteur {secteur} avec la référence</caption>
        <thead>
          <tr>
            <th scope="col">Indicateur</th>
            <th scope="col">{label}</th>
            <th scope="col">Référence</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {indicateurs.map((indicateur) => (
            <tr key={indicateur.libelle}>
              <th scope="row">{indicateur.libelle}</th>
              <td>{formatValeur(indicateur.valeur_secteur ?? 0, indicateur.unite ?? "")}</td>
              <td>
                {formatValeur(indicateur.valeur_reference ?? 0, indicateur.unite ?? "")} ({indicateur.libelle_reference})
              </td>
              <td>
                {indicateur.source_libelle} ({indicateur.annee})
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Box component="figcaption" sx={{ mt: fr.spacing("4v"), fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>
        Sources :{" "}
        {indicateurs.map((indicateur, idx) => (
          <span key={indicateur.libelle}>
            {idx > 0 && " · "}
            {indicateur.source_url ? <DsfrLink href={indicateur.source_url}>{indicateur.source_libelle}</DsfrLink> : indicateur.source_libelle} ({indicateur.annee})
          </span>
        ))}
      </Box>
    </Box>
  )
}
