import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { Map, Popup } from "mapbox-gl"
import Image from "next/image"
import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { ILbaItemFormation, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"

import { useResultItemUrl } from "@/app/(candidat)/recherche/_hooks/useResultItemUrl"
import { useUpdateCandidatSearchParam } from "@/app/(candidat)/recherche/_hooks/useUpdateCandidatSearchParam"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

type RechercheMapPopupProps = {
  map: Map | null
  item: ILbaItemLbaCompany | ILbaItemPartnerJob | ILbaItemFormation | ILbaItemLbaJob | null
}

const popupElement = globalThis.window === null ? null : document.createElement("div")

function RechercheMapPopupContent(props: { item: ILbaItemLbaCompany | ILbaItemPartnerJob | ILbaItemFormation | ILbaItemLbaJob }) {
  const url = useResultItemUrl(props.item)

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
        <Image src="/images/icons/job.svg" width={40} height={40} alt="" unoptimized />
        <Typography variant="h4">Opportunités d’emploi</Typography>
      </Box>
      <Typography
        sx={{
          color: fr.colors.decisions.text.mention.grey.default,
        }}
        className={fr.cx("fr-text--sm")}
      >
        {props.item.place.fullAddress}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: fr.spacing("1w"),
        }}
      >
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
      </Box>
    </Box>
  )
}

export function RechercheMapPopup(props: RechercheMapPopupProps) {
  const [popup, setPopup] = useState<Popup | null>(null)
  const updateCandidatSearchParam = useUpdateCandidatSearchParam()

  useEffect(() => {
    if (props.map === null || popupElement === null) {
      return
    }

    setPopup(new Popup({}).setDOMContent(popupElement))
  }, [props.map])

  const onClose = useCallback(() => {
    updateCandidatSearchParam({ selection: [] }, true)
  }, [updateCandidatSearchParam])

  useLayoutEffect(() => {
    if (props.map === null || popup === null || props.item === null) {
      return
    }

    const timeout = setTimeout(() => {
      popup.setLngLat([props.item.place.longitude, props.item.place.latitude]).addTo(props.map)
    }, 300)

    popup.once("close", onClose)

    return () => {
      clearTimeout(timeout)
      popup.off("close", onClose)
      popup.remove()
    }
  }, [props.map, props.item, popup, onClose])

  if (!props.item || !popup) {
    return null
  }

  return createPortal(<RechercheMapPopupContent item={props.item} />, popupElement)
}
