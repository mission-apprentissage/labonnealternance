"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import type { ILbaItemLbaCompanyJson, ILbaItemNaf, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { LbaJobEngagement } from "@/components/ItemDetail/LbaJobComponents/LbaJobEngagement"
import { isOfferActive } from "@/utils/is-offer-active"
import { getCompanySize } from "./get-company-size"
import HiringCountBox from "./HiringCountBox"
import { InlineField } from "./InlineField"
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
  item: ILbaItemPartnerJobJson | ILbaItemLbaCompanyJson
  description?: string | null
  emptyStateText?: string
  showPhone?: boolean
  showWebsite?: boolean
  showGoogleSearch?: boolean
  cityOnly?: boolean
}) => {
  const isHandicapEngaged = Boolean(("job" in item && item.job?.elligibleHandicap) || item?.company?.elligibleHandicap)
  const hiringCount3Years = item?.company?.hiringCount3Years
  // Offre LBA non active (annulée, pourvue, en attente) : le téléphone du recruteur n'est plus affiché.
  // Redondant avec le serveur qui renvoie déjà phone: null dans ce cas ; filet de sécurité côté UI.
  const phone = showPhone && (item.ideaType !== LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA || isOfferActive(item)) ? item?.contact?.phone : null

  return (
    <Box sx={{ mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
      <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
        {title}
      </Typography>

      {description ? (
        <Box
          sx={{
            whiteSpace: "pre-wrap",
            mb: fr.spacing("6v"),
          }}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      ) : emptyStateText ? (
        <Typography sx={{ whiteSpace: "pre-wrap", mb: fr.spacing("6v") }}>{emptyStateText}</Typography>
      ) : null}

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
          <Typography>
            <Box component="span" sx={{ fontWeight: 700 }}>
              Localisation :
            </Box>{" "}
            {item?.place?.city}
            <ItemDistanceToCenter item={item as any} />
          </Typography>
        ) : (
          <ItemLocalisation item={item as any} />
        )}

        <Stack component="dl" spacing={fr.spacing("2v")} sx={{ m: 0, p: 0 }}>
          <InlineField label="Taille de l'entreprise :">{getCompanySize(item as any)}</InlineField>

          {(item.nafs as ILbaItemNaf[])[0]?.label && <InlineField label="Secteur d'activité :">{(item.nafs as ILbaItemNaf[])[0].label}</InlineField>}

          {phone && (
            <InlineField label="Téléphone :">
              <DsfrLink href={`tel:${phone}`}>
                {phone}
                <span className="fr-sr-only"> - appeler la société</span>
              </DsfrLink>
            </InlineField>
          )}
        </Stack>

        {showWebsite && <ItemWebsiteLink item={item} />}
        {showGoogleSearch && <ItemGoogleSearchLink item={item as any} />}
      </Stack>
    </Box>
  )
}
