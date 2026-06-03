import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
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
    <Box>
      {/* Badge */}
      <Box sx={{ mb: fr.spacing("3v") }}>
        <span className={fr.cx("fr-badge", "fr-badge--sm", "fr-badge--success")}>Formation</span>
      </Box>

      {/* Titre */}
      <Box component="h2" sx={{ fontSize: "1.375rem", fontWeight: 700, color: fr.colors.decisions.text.title.grey.default, mb: fr.spacing("2v"), lineHeight: 1.25 }}>
        {title}
      </Box>

      {/* CFA & lieu */}
      <Box sx={{ mb: fr.spacing("4v") }}>
        {cfaName && <Box sx={{ fontSize: "1.125rem", fontWeight: 700, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>{cfaName}</Box>}
        {(fullAddress || city) && (
          <Box
            sx={{ mt: fr.spacing("1v"), display: "flex", alignItems: "center", gap: fr.spacing("1v"), color: fr.colors.decisions.text.mention.grey.default, fontSize: "0.9375rem" }}
          >
            <span className={fr.cx("fr-icon-map-pin-2-line", "fr-icon--sm")} aria-hidden="true" />
            {fullAddress ?? city}
          </Box>
        )}
      </Box>

      <Box component="hr" sx={{ border: "none", borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`, my: fr.spacing("5v") }} />

      {/* Diplôme & niveau */}
      {(diploma || targetDiplomaLevel) && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: `${fr.spacing("2v")} ${fr.spacing("6v")}`,
            mb: fr.spacing("4v"),
            color: fr.colors.decisions.text.mention.grey.default,
            fontSize: "0.9375rem",
          }}
        >
          {diploma && (
            <Box>
              <Box component="span" sx={{ fontWeight: 700, color: fr.colors.decisions.text.title.grey.default }}>
                Diplôme :{" "}
              </Box>
              {diploma}
            </Box>
          )}
          {targetDiplomaLevel && (
            <Box>
              <Box component="span" sx={{ fontWeight: 700, color: fr.colors.decisions.text.title.grey.default }}>
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
          <Box sx={{ fontWeight: 700, color: fr.colors.decisions.text.title.grey.default, mb: fr.spacing("1v"), fontSize: "1rem" }}>Prochaines sessions</Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("1v") }}>
            {sessions.slice(0, 3).map((session, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v"), color: fr.colors.decisions.text.default.grey.default, fontSize: "0.9375rem" }}>
                <span className={fr.cx("fr-icon-calendar-line", "fr-icon--sm")} aria-hidden="true" />
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
          <Box sx={{ fontWeight: 700, color: fr.colors.decisions.text.title.grey.default, mb: fr.spacing("1v"), fontSize: "1rem" }}>Objectif</Box>
          <Box sx={{ color: fr.colors.decisions.text.default.grey.default, fontSize: "0.9375rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>{objectif}</Box>
        </Box>
      )}

      {/* Description */}
      {description && (
        <Box sx={{ mb: fr.spacing("4v") }}>
          <Box sx={{ fontWeight: 700, color: fr.colors.decisions.text.title.grey.default, mb: fr.spacing("1v"), fontSize: "1rem" }}>Description</Box>
          <Box sx={{ color: fr.colors.decisions.text.default.grey.default, fontSize: "0.9375rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>{description}</Box>
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("2v"), mt: fr.spacing("6v") }}>
        {appointmentUrl && (
          <Button linkProps={{ href: appointmentUrl }} priority="primary" style={{ width: "100%", justifyContent: "center" }}>
            Prendre rendez-vous
          </Button>
        )}
        <Button linkProps={{ href: detailUrl }} priority="secondary" iconId="fr-icon-arrow-right-line" iconPosition="right" style={{ width: "100%", justifyContent: "center" }}>
          Voir la fiche complète
        </Button>
      </Box>
    </Box>
  )
}
