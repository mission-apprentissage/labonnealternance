"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import { LBA_ITEM_TYPE_OLD, newItemTypeToOldItemType, oldItemTypeToNewItemType } from "shared/constants/lbaitem"

import { ILbaItem } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { localStorageGet } from "@/utils/localStorage"

export default function ItemDetailApplicationsStatus({ item }: { item: ILbaItem }) {
  const key = `application-${newItemTypeToOldItemType(item.ideaType)}-${item.id}`
  const oldKey = `application-${oldItemTypeToNewItemType(item.ideaType)}-${item.id}`
  const applicationDateString = localStorageGet(key) ?? localStorageGet(oldKey)
  if (!applicationDateString) {
    return null
  }
  const date = new Date(parseInt(applicationDateString, 10))
  const dateString = date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const { ideaType } = item

  return (
    <Typography
      component="span"
      sx={{
        backgroundColor: fr.colors.decisions.background.contrast.info.default,
        color: fr.colors.decisions.background.actionHigh.info.default,
        px: fr.spacing("1w"),
        // py: fr.spacing("1v"),
        fontStyle: "italic",
      }}
      className={fr.cx("ri-history-line", "fr-icon--sm", "fr-text--xs")}
    >
      {" "}
      {ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? <>Super, vous avez déjà pris contact le {dateString}.</> : <>Bravo, vous avez déjà postulé le {dateString}.</>}
    </Typography>
  )
}
