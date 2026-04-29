"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import type { ILbaItemNaf, ILbaItemPartnerJobJson } from "shared"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { LbaJobEngagement } from "@/components/ItemDetail/LbaJobComponents/LbaJobEngagement"
import { getCompanySize } from "./getCompanySize"
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

  return (
    <Box sx={{ mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
      <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
        {title}
      </Typography>

      {isHandicapEngaged && (
        <Box sx={{ mb: fr.spacing("4v") }}>
          <LbaJobEngagement />
        </Box>
      )}

      <Typography sx={{ my: fr.spacing("4v") }}>{description || emptyStateText}</Typography>

      {cityOnly ? (
        <Typography sx={{ mt: fr.spacing("2v") }}>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            Localisation :{" "}
          </Typography>
          <Typography component="span">{item?.place?.city}</Typography>
          <br />
          <ItemDistanceToCenter item={item as any} />
        </Typography>
      ) : (
        <ItemLocalisation item={item as any} />
      )}

      <Typography sx={{ mt: fr.spacing("2v") }}>
        <Typography component="span" sx={{ fontWeight: 700 }}>
          Taille de l&apos;entreprise :{" "}
        </Typography>
        <Typography component="span">{getCompanySize(item as any)}</Typography>
      </Typography>

      {(item.nafs as ILbaItemNaf[])[0]?.label && (
        <Typography sx={{ mt: fr.spacing("2v") }}>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            Secteur d&apos;activité :{" "}
          </Typography>
          <Typography component="span">{(item.nafs as ILbaItemNaf[])[0].label}</Typography>
        </Typography>
      )}

      {showPhone && item?.contact?.phone && (
        <Typography sx={{ mt: fr.spacing("2v") }}>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            Téléphone :{" "}
          </Typography>
          <Typography component="span">
            <DsfrLink href={`tel:${item.contact.phone}`} aria-label="Appeler la société au téléphone">
              {item.contact.phone}
            </DsfrLink>
          </Typography>
        </Typography>
      )}

      {showWebsite && <ItemWebsiteLink item={item} />}
      {showGoogleSearch && <ItemGoogleSearchLink item={item as any} />}
    </Box>
  )
}
