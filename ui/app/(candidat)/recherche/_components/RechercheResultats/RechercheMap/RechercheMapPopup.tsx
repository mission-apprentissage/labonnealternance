import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { Map, Popup } from "mapbox-gl"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import type { ILbaItem } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { useResultItemUrl } from "@/app/(candidat)/recherche/_hooks/useResultItemUrl"
import { useUpdateCandidatSearchParam } from "@/app/(candidat)/recherche/_hooks/useUpdateCandidatSearchParam"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

type RechercheMapPopupProps = {
  map: Map | null
  selection: ILbaItem[]
}

const popupElement = globalThis.document == null ? null : globalThis.document.createElement("div")

function RechercheMapPopupLink(props: { item: ILbaItem }) {
  const url = useResultItemUrl(props.item)

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

function RechercheMapPopupContent(props: { selection: ILbaItem[] }) {
  const type = props.selection[0].ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? "formation" : "job"
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
          {type === "formation" ? `Formation${props.selection.length > 1 ? "s" : ""}` : `Opportunité${props.selection.length > 1 ? "s" : ""} d'emploi`}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: fr.colors.decisions.text.mention.grey.default,
        }}
        className={fr.cx("fr-text--sm")}
      >
        {props.selection[0].place.fullAddress}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: fr.spacing("1w"),
        }}
      >
        {props.selection.map((item) => (
          <RechercheMapPopupLink key={item.id} item={item} />
        ))}
      </Box>
    </Box>
  )
}

export function RechercheMapPopup(props: RechercheMapPopupProps) {
  const [popup, setPopup] = useState<Popup | null>(null)
  const updateCandidatSearchParam = useUpdateCandidatSearchParam()

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
      }).setDOMContent(popupElement)
    )
    // popupElement instance will change on dev mode reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.map, popupElement])

  const onClose = useCallback(() => {
    updateCandidatSearchParam({ selection: [] }, true)
  }, [updateCandidatSearchParam])

  useEffect(() => {
    if (props.map === null || popup === null || props.selection.length === 0) {
      return
    }

    // All selected items have the same place
    popup.setLngLat([props.selection[0].place.longitude, props.selection[0].place.latitude]).addTo(props.map)
    popup.on("close", onClose)

    return () => {
      popup.off("close", onClose)
      popup.remove()
    }
  }, [props.map, props.selection, popup, onClose])

  if (props.selection.length === 0 || !popup) {
    return null
  }

  return createPortal(<RechercheMapPopupContent selection={props.selection} />, popupElement)
}
