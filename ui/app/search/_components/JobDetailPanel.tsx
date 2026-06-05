import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
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
    <Box>
      {/* Badge */}
      <Box sx={{ mb: fr.spacing("3v") }}>
        <span className={fr.cx("fr-badge", "fr-badge--sm", "fr-badge--info")}>Offre d'emploi</span>
      </Box>

      {/* Titre */}
      <Box component="h2" sx={{ fontSize: "1.375rem", fontWeight: 700, color: fr.colors.decisions.text.title.grey.default, mb: fr.spacing("2v"), lineHeight: 1.25 }}>
        {title}
      </Box>

      {/* Entreprise & lieu */}
      <Box sx={{ mb: fr.spacing("4v") }}>
        {companyName && <Box sx={{ fontSize: "1.125rem", fontWeight: 700, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>{companyName}</Box>}
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

      {/* Infos complémentaires */}
      {(contractType || targetDiplomaLevel || applicationCount != null) && (
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
          {contractType && (
            <Box>
              <Box component="span" sx={{ fontWeight: 700, color: fr.colors.decisions.text.title.grey.default }}>
                Contrat :{" "}
              </Box>
              {contractType}
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
          {applicationCount != null && (
            <Box>
              <Box component="span" sx={{ fontWeight: 700, color: fr.colors.decisions.text.title.grey.default }}>
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
          <Box sx={{ fontWeight: 700, color: fr.colors.decisions.text.title.grey.default, mb: fr.spacing("1v"), fontSize: "1rem" }}>À propos de l'entreprise</Box>
          <Box sx={{ color: fr.colors.decisions.text.default.grey.default, fontSize: "0.9375rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>{employeurDescription}</Box>
        </Box>
      )}

      {/* Description du poste */}
      {jobDescription && (
        <Box sx={{ mb: fr.spacing("4v") }}>
          <Box sx={{ fontWeight: 700, color: fr.colors.decisions.text.title.grey.default, mb: fr.spacing("1v"), fontSize: "1rem" }}>Description du poste</Box>
          <Box sx={{ color: fr.colors.decisions.text.default.grey.default, fontSize: "0.9375rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>{jobDescription}</Box>
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("2v"), mt: fr.spacing("6v") }}>
        {applicationUrl && (
          <Button linkProps={{ href: applicationUrl, target: "_blank", rel: "noopener noreferrer" }} priority="primary" style={{ width: "100%", justifyContent: "center" }}>
            J'envoie ma candidature
          </Button>
        )}
        <Button
          linkProps={{ href: detailUrl, target: "_blank", rel: "noopener noreferrer" }}
          priority="secondary"
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Voir l'offre complète
        </Button>
      </Box>
    </Box>
  )
}
