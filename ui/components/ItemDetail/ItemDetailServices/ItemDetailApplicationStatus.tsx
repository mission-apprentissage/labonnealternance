"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import {
  ILbaItemFormation,
  ILbaItemFormationJson,
  ILbaItemFtJobJson,
  ILbaItemLbaCompany,
  ILbaItemLbaCompanyJson,
  ILbaItemLbaJob,
  ILbaItemLbaJobJson,
  ILbaItemPartnerJob,
  ILbaItemPartnerJobJson,
} from "shared"
import {  LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { localStorageGet } from "@/utils/localStorage"
import { useMemo } from "react"


export const hasApplied = (item: ILbaItemFormationJson | ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemFtJobJson | ILbaItemPartnerJobJson) => {
  return localStorage.getItem(`application-${item.ideaType}-${item.id}`) !== null
}

export default function ItemDetailApplicationsStatus({ item }: { item: ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob | ILbaItemFormation }) {
  const key = `application-${item.ideaType}-${item.id}`
  const applicationDate = localStorageGet(key)

  const message = useMemo(() => {
    if (applicationDate == null) {
      return null;
    }
    
    const date = new Date(parseInt(applicationDate, 10)).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  
    return item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? ` Super, vous avez déjà pris contact le ${date}.` : ` Bravo, vous avez déjà postulé le ${date}.`
  }, [applicationDate, item.ideaType]);

  if (message === null) {
    return null;
  }

  return (
    <Typography
      component="span"
      sx={{
        backgroundColor: fr.colors.decisions.background.contrast.info.default,
        color: fr.colors.decisions.background.actionHigh.info.default,
        px: fr.spacing("1w"),
        py: fr.spacing('1v'),
        fontStyle: "italic",
      }}
      className={fr.cx("ri-history-line", "fr-icon--sm", "fr-text--xs")}
    >
        {message}
    </Typography>
  )
}
