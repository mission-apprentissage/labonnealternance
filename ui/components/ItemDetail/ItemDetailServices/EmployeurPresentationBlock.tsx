"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import type { ILbaItemNaf, ILbaItemPartnerJobJson } from "shared"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { LbaJobEngagement } from "@/components/ItemDetail/LbaJobComponents/LbaJobEngagement"
import { getCompanySize } from "./get-company-size"
import HiringCountBox from "./HiringCountBox"
import ItemDistanceToCenter from "./ItemDistanceToCenter"
import ItemGoogleSearchLink from "./ItemGoogleSearchLink"
import ItemLocalisation from "./ItemLocalisation"
import ItemWebsiteLink from "./ItemWebsiteLink"

const DEFAULT_EMPTY_STATE =
  "Renseignez-vous sur l'entreprise, ses activités et ses valeurs pour préparer votre candidature. Vous pouvez rechercher leur site internet et leur présence sur les réseaux sociaux."

export const EmployeurPresentationBlock = ({
  title,
  item,
  description,
  emptyStateText = DEFAULT_EMPTY_STATE,
  showPhone = true,
  showWebsite = false,
  showGoogleSearch = true,
  cityOnly = false,
}: {
  title: string
  item: ILbaItemPartnerJobJson
  description?: string | null
  emptyStateText?: string
  showPhone?: boolean
  showWebsite?: boolean
  showGoogleSearch?: boolean
  cityOnly?: boolean
}) => {
  const isHandicapEngaged = Boolean(item?.job?.elligibleHandicap || item?.company?.elligibleHandicap)
  const hiringCount3Years = item?.company?.hiringCount3Years

  return (
    <Box sx={{ mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
      <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
        {title}
      </Typography>

      <Box
        sx={{
          whiteSpace: "pre-wrap",
          mb: fr.spacing("6v"),
        }}
        dangerouslySetInnerHTML={{ __html: description || emptyStateText }}
      />

      {isHandicapEngaged && (
        <Box sx={{ mb: fr.spacing("6v") }}>
          <LbaJobEngagement />
        </Box>
      )}

      {typeof hiringCount3Years === "number" && hiringCount3Years > 0 && (
        <Box sx={{ mb: fr.spacing("4v") }}>
          <HiringCountBox hiringCount3Years={hiringCount3Years} />
        </Box>
      )}

      <Stack spacing={fr.spacing("2v")} sx={{ mb: fr.spacing("4v") }}>
        {cityOnly ? (
          <div>
            <strong>Localisation :</strong> {item?.place?.city}
            <ItemDistanceToCenter item={item as any} />
          </div>
        ) : (
          <ItemLocalisation item={item as any} />
        )}

        <div>
          <strong>Taille de l'entreprise : </strong> {getCompanySize(item as any)}
        </div>

        {(item.nafs as ILbaItemNaf[])[0]?.label && (
          <div>
            <strong>Secteur d&apos;activité : </strong> {(item.nafs as ILbaItemNaf[])[0].label}
          </div>
        )}

        {showPhone && item?.contact?.phone && (
          <div>
            <strong>Téléphone : </strong>
            <DsfrLink href={`tel:${item.contact.phone}`} aria-label="Appeler la société au téléphone">
              {item.contact.phone}
            </DsfrLink>
          </div>
        )}

        {showWebsite && <ItemWebsiteLink item={item} />}
        {showGoogleSearch && <ItemGoogleSearchLink item={item as any} />}
      </Stack>
    </Box>
  )
}
