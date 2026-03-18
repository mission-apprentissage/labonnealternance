import { fr } from "@codegouvfr/react-dsfr"
import { Box, Button } from "@mui/material"
import type { ILbaItemFormation2Json } from "shared/models/lbaItem.model"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildHitDetailUrl, buildSearchUrl } from "../_utils/search.params.utils"

interface FormationDetailPanelProps {
  training: ILbaItemFormation2Json
  currentParams: ISearchPageParams
}

export function FormationDetailPanel({ training, currentParams }: FormationDetailPanelProps) {
  const title = training.training?.title ?? "Formation sans titre"
  const cfaName = training.company?.name
  const city = training.place?.city
  const fullAddress = training.place?.fullAddress
  const diploma = training.training?.diploma
  const targetDiplomaLevel = training.training?.target_diploma_level
  const description = training.training?.description
  const objectif = training.training?.objectif
  const elligibleForAppointment = training.training?.elligibleForAppointment
  const sessions = training.training?.sessions

  const detailUrl = buildHitDetailUrl({ sub_type: training.type, url_id: training.id, title }, buildSearchUrl(currentParams))

  const appointmentUrl = elligibleForAppointment ? detailUrl : null

  return (
    <Box sx={{ p: fr.spacing("6v") }}>
      {/* Badge */}
      <Box sx={{ mb: fr.spacing("3v") }}>
        <span className={fr.cx("fr-badge", "fr-badge--sm")} style={{ backgroundColor: fr.colors.decisions.background.actionHigh.greenTilleulVerveine.default, color: "#fff" }}>
          Formation
        </span>
      </Box>

      {/* Titre */}
      <Box
        component="h2"
        sx={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "#1E293B",
          mb: fr.spacing("2v"),
          lineHeight: 1.3,
        }}
      >
        {title}
      </Box>

      {/* CFA & lieu */}
      <Box sx={{ color: "#475569", fontSize: "0.9375rem", mb: fr.spacing("4v") }}>
        {cfaName && <Box sx={{ fontWeight: 500 }}>{cfaName}</Box>}
        {(fullAddress || city) && (
          <Box sx={{ mt: fr.spacing("1v"), display: "flex", alignItems: "center", gap: fr.spacing("1v") }}>
            <span className={fr.cx("fr-icon-map-pin-2-line", "fr-icon--sm")} aria-hidden="true" />
            {fullAddress ?? city}
          </Box>
        )}
      </Box>

      {/* Diplôme & niveau */}
      {(diploma || targetDiplomaLevel) && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("4v"), mb: fr.spacing("4v"), color: "#64748B", fontSize: "0.875rem" }}>
          {diploma && (
            <Box>
              <Box component="span" sx={{ fontWeight: 600 }}>
                Diplôme :{" "}
              </Box>
              {diploma}
            </Box>
          )}
          {targetDiplomaLevel && (
            <Box>
              <Box component="span" sx={{ fontWeight: 600 }}>
                Niveau :{" "}
              </Box>
              {targetDiplomaLevel}
            </Box>
          )}
        </Box>
      )}

      {/* Sessions */}
      {sessions && sessions.length > 0 && (
        <Box sx={{ mb: fr.spacing("4v") }}>
          <Box sx={{ fontWeight: 600, color: "#1E293B", mb: fr.spacing("1v"), fontSize: "0.9375rem" }}>Prochaines sessions</Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("1v") }}>
            {sessions.slice(0, 3).map((session, i) => (
              <Box key={i} sx={{ color: "#334155", fontSize: "0.875rem" }}>
                {session.isPermanentEntry
                  ? "Entrée permanente"
                  : session.startDate
                    ? new Date(session.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                    : "Date non précisée"}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Objectif */}
      {objectif && (
        <Box sx={{ mb: fr.spacing("4v") }}>
          <Box sx={{ fontWeight: 600, color: "#1E293B", mb: fr.spacing("1v"), fontSize: "0.9375rem" }}>Objectif</Box>
          <Box sx={{ color: "#334155", fontSize: "0.875rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>{objectif}</Box>
        </Box>
      )}

      {/* Description */}
      {description && (
        <Box sx={{ mb: fr.spacing("4v") }}>
          <Box sx={{ fontWeight: 600, color: "#1E293B", mb: fr.spacing("1v"), fontSize: "0.9375rem" }}>Description</Box>
          <Box sx={{ color: "#334155", fontSize: "0.875rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>{description}</Box>
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("2v"), mt: fr.spacing("6v") }}>
        {appointmentUrl && (
          <Button component="a" href={appointmentUrl} variant="contained" sx={{ backgroundColor: "#2563EB", "&:hover": { backgroundColor: "#1D4ED8" } }}>
            Prendre rendez-vous
          </Button>
        )}
        <Button component="a" href={detailUrl} variant="outlined" sx={{ borderColor: "#2563EB", color: "#2563EB" }}>
          Voir la fiche complète →
        </Button>
      </Box>
    </Box>
  )
}
