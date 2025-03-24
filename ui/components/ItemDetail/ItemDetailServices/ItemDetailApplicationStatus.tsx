"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import { useMemo } from "react"
import { ILbaItemFormationJson, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { ILbaItem } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { localStorageGet } from "@/utils/localStorage"

export const hasApplied = (item: ILbaItemFormationJson | ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemFtJobJson | ILbaItemPartnerJobJson) => {
  return localStorage.getItem(`application-${item.ideaType}-${item.id}`) !== null
}

export default function ItemDetailApplicationsStatus({ item }: { item: ILbaItem }) {
  const key = `application-${item.ideaType}-${item.id}`
  const applicationDate = localStorageGet(key)

  const message = useMemo(() => {
    if (applicationDate == null) {
      return null
    }

    const date = new Date(parseInt(applicationDate, 10)).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    return item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? ` Super, vous avez déjà pris contact le ${date}.` : ` Bravo, vous avez déjà postulé le ${date}.`
  }, [applicationDate, item.ideaType])

  if (message === null) {
    return null
  }

  return (
    <Typography
      component="span"
      sx={{
        backgroundColor: fr.colors.decisions.background.contrast.info.default,
        color: fr.colors.decisions.background.actionHigh.info.default,
        px: fr.spacing("1w"),
        py: fr.spacing("1v"),
        fontStyle: "italic",
      }}
      className={fr.cx("ri-history-line", "fr-icon--sm", "fr-text--xs")}
    >
      {message}
    </Typography>
  )
}
