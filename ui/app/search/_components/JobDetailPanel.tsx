import { fr } from "@codegouvfr/react-dsfr"
import { Box, Button } from "@mui/material"
import type { ILbaItemJobsGlobal } from "shared/models/lbaItem.model"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildHitDetailUrl, buildSearchUrl } from "../_utils/search.params.utils"

interface JobDetailPanelProps {
  job: ILbaItemJobsGlobal
  currentParams: ISearchPageParams
}

function getIdeaType(job: ILbaItemJobsGlobal): string {
  return job.ideaType
}

export function JobDetailPanel({ job, currentParams }: JobDetailPanelProps) {
  const ideaType = getIdeaType(job)
  const title = job.title ?? job.company?.name ?? "Offre sans titre"
  const companyName = job.company?.name
  const fullAddress = job.place?.fullAddress
  const city = job.place?.city

  const applicationUrl = "contact" in job && job.contact?.url ? job.contact.url : null

  const jobDescription = "job" in job && job.job ? job.job.description : null
  const employeurDescription = "job" in job && job.job ? job.job.employeurDescription : null
  const contractType = "job" in job && job.job ? job.job.contractType : null
  const targetDiplomaLevel = "target_diploma_level" in job ? job.target_diploma_level : null
  const applicationCount = "applicationCount" in job ? job.applicationCount : null

  const urlId = job.id ?? ""
  const detailUrl = buildHitDetailUrl({ sub_type: ideaType, url_id: String(urlId), title: title }, buildSearchUrl(currentParams))

  return (
    <Box sx={{ p: fr.spacing("6v") }}>
      {/* Badges */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("1v"), mb: fr.spacing("3v") }}>
        <span className={fr.cx("fr-badge", "fr-badge--sm")} style={{ backgroundColor: fr.colors.decisions.background.actionHigh.blueFrance.default, color: "#fff" }}>
          {ideaType}
        </span>
        {contractType && <span className={fr.cx("fr-badge", "fr-badge--sm")}>{contractType}</span>}
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

      {/* Entreprise & lieu */}
      <Box sx={{ color: "#475569", fontSize: "0.9375rem", mb: fr.spacing("4v") }}>
        {companyName && <Box sx={{ fontWeight: 500 }}>{companyName}</Box>}
        {(fullAddress || city) && (
          <Box sx={{ mt: fr.spacing("1v"), display: "flex", alignItems: "center", gap: fr.spacing("1v") }}>
            <span className={fr.cx("fr-icon-map-pin-2-line", "fr-icon--sm")} aria-hidden="true" />
            {fullAddress ?? city}
          </Box>
        )}
      </Box>

      {/* Infos complémentaires */}
      {(targetDiplomaLevel || applicationCount != null) && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("4v"), mb: fr.spacing("4v"), color: "#64748B", fontSize: "0.875rem" }}>
          {targetDiplomaLevel && (
            <Box>
              <Box component="span" sx={{ fontWeight: 600 }}>
                Niveau :{" "}
              </Box>
              {targetDiplomaLevel}
            </Box>
          )}
          {applicationCount != null && (
            <Box>
              <Box component="span" sx={{ fontWeight: 600 }}>
                Candidatures :{" "}
              </Box>
              {applicationCount}
            </Box>
          )}
        </Box>
      )}

      {/* Description employeur */}
      {employeurDescription && (
        <Box sx={{ mb: fr.spacing("4v") }}>
          <Box sx={{ fontWeight: 600, color: "#1E293B", mb: fr.spacing("1v"), fontSize: "0.9375rem" }}>À propos de l'entreprise</Box>
          <Box sx={{ color: "#334155", fontSize: "0.875rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>{employeurDescription}</Box>
        </Box>
      )}

      {/* Description du poste */}
      {jobDescription && (
        <Box sx={{ mb: fr.spacing("4v") }}>
          <Box sx={{ fontWeight: 600, color: "#1E293B", mb: fr.spacing("1v"), fontSize: "0.9375rem" }}>Description du poste</Box>
          <Box sx={{ color: "#334155", fontSize: "0.875rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>{jobDescription}</Box>
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("2v"), mt: fr.spacing("6v") }}>
        {applicationUrl && (
          <Button
            component="a"
            href={applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            sx={{ backgroundColor: "#2563EB", "&:hover": { backgroundColor: "#1D4ED8" } }}
          >
            Postuler
          </Button>
        )}
        <Button component="a" href={detailUrl} variant="outlined" sx={{ borderColor: "#2563EB", color: "#2563EB" }}>
          Voir la fiche complète →
        </Button>
      </Box>
    </Box>
  )
}
