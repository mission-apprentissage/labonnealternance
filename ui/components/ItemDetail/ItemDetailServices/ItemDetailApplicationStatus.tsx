"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import { LBA_ITEM_TYPE_OLD, newItemTypeToOldItemType, oldItemTypeToNewItemType } from "shared/constants/lbaitem"

import type { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { localStorageGet } from "@/utils/localStorage"

const blueApplicationTag = (icon, text) => (
  <Typography
    component="span"
    sx={{
      backgroundColor: fr.colors.decisions.background.contrast.info.default,
      color: fr.colors.decisions.background.actionHigh.info.default,
      whiteSpace: "nowrap",
      px: fr.spacing("2v"),
      mx: fr.spacing("3v"),
      fontStyle: "italic",
      width: "fit-content",
    }}
    className={fr.cx(icon, "fr-icon--sm", "fr-text--sm")}
  >
    {text}
  </Typography>
)

export const tagCandidatureSimplifiee = () => blueApplicationTag("fr-icon-mail-send-fill", "Candidature simplifiée")

export default function ItemDetailApplicationsStatus({ item }: { item: ILbaItem }) {
  const key = `application-${newItemTypeToOldItemType(item.ideaType)}-${item.id}`
  const oldKey = `application-${oldItemTypeToNewItemType(item.ideaType)}-${item.id}`
  const { ideaType } = item
  const applicationDateString = localStorageGet(key) ?? localStorageGet(oldKey)
  if (!applicationDateString) {
    if (item?.contact?.hasEmail) {
      return tagCandidatureSimplifiee()
    }
    return null
  }
  const date = new Date(parseInt(applicationDateString, 10))
  const dateString = date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return blueApplicationTag(
    "ri-history-line",
    ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? <>Super, vous avez déjà pris contact le {dateString}.</> : <>Bravo, vous avez déjà postulé le {dateString}.</>
  )
}
