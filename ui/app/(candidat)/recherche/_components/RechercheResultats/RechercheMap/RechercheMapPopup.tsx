import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { Map, Popup } from "mapbox-gl"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { ILbaItem } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { useResultItemUrl } from "@/app/(candidat)/recherche/_hooks/useResultItemUrl"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

type RechercheMapPopupProps = {
  map: Map | null
  activeItems: ILbaItem[]
  variant: "recherche" | "detail"
}

const popupElement = globalThis.document == null ? null : globalThis.document.createElement("div")

function RechercheMapPopupLink(props: WithRecherchePageParams<{ item: ILbaItem }>) {
  const url = useResultItemUrl(props.item, props.params)

  return (
    <Box>
      <DsfrLink
        href={url}
        size="sm"
        style={{
          color: fr.colors.decisions.text.title.grey.default,
        }}
      >
        {props.item.title}
      </DsfrLink>
    </Box>
  )
}

function RechercheMapPopupContent(props: WithRecherchePageParams<{ activeItems: ILbaItem[] }>) {
  const type = props.activeItems[0].ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? "formation" : "job"
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("2w"),
        margin: fr.spacing("2w"),
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: fr.spacing("1w"),
          alignItems: "center",
        }}
      >
        <Image src={type === "formation" ? "/images/icons/book.svg" : "/images/icons/job.svg"} width={40} height={40} alt="" unoptimized />
        <Typography variant="h4">
          {type === "formation" ? `Formation${props.activeItems.length > 1 ? "s" : ""}` : `Opportunité${props.activeItems.length > 1 ? "s" : ""} d'emploi`}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: fr.colors.decisions.text.mention.grey.default,
        }}
        className={fr.cx("fr-text--sm")}
      >
        {props.activeItems[0].place.fullAddress}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: fr.spacing("1w"),
        }}
      >
        {props.activeItems.map((item) => (
          <RechercheMapPopupLink key={item.id} item={item} params={props.params} />
        ))}
      </Box>
    </Box>
  )
}

export function RechercheMapPopup(props: WithRecherchePageParams<RechercheMapPopupProps>) {
  const [popup, setPopup] = useState<Popup | null>(null)
  const navigateToRecherchePage = useNavigateToRecherchePage(props.params)

  useEffect(() => {
    if (props.map === null || popupElement === null) {
      setPopup((prev) => {
        if (prev !== null) {
          prev.remove()
        }
        return null
      })
      return
    }

    setPopup(
      new Popup({
        offset: 30,
        closeOnClick: false,
      }).setDOMContent(popupElement)
    )
    // popupElement instance will change on dev mode reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.map, popupElement])

  const onClose = useCallback(() => {
    if (props.variant === "detail") {
      return
    }

    navigateToRecherchePage({ activeItems: [] }, true)
  }, [navigateToRecherchePage, props.variant])

  useEffect(() => {
    if (props.map === null || popup === null || props.activeItems.length === 0) {
      return
    }

    // All selected items have the same place
    popup.setLngLat([props.activeItems[0].place.longitude, props.activeItems[0].place.latitude]).addTo(props.map)
    popup.on("close", onClose)

    return () => {
      popup.off("close", onClose)
      popup.remove()
    }
  }, [props.map, props.activeItems, popup, onClose])

  if (props.activeItems.length === 0 || !popup) {
    return null
  }

  return createPortal(<RechercheMapPopupContent activeItems={props.activeItems} params={props.params} />, popupElement)
}
