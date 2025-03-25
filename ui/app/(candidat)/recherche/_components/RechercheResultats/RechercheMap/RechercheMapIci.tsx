"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { LngLat, Map as Mapbox } from "mapbox-gl"
import { useCallback, useEffect, useState } from "react"

import { earthCircumferenceKm, mapboxTileSize } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams, WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { radiusOptions } from "@/app/_components/RechercheForm/RechercheForm"

type RechercheMapIciProps = {
  map: Mapbox
  radius: number | null
  searchArea: { center: [number, number]; zoom: number }
}

const RADIUS_OPTIONS_VALUES = radiusOptions.map((option) => parseFloat(option.value))

const MAX_RADIUS = Math.max(...RADIUS_OPTIONS_VALUES)

function computeNewSearchGeoParams(map: Mapbox): Required<IRecherchePageParams["geo"]> {
  const newCenter = map.getCenter()
  const newZoom = map.getZoom()

  // Get the new radius according to the zoom level
  // ==> zoom = log2(earthCircumference * cos(latitude) * fitSize / (2 * radius * mapboxTileSize))
  // ==> radius = earthCircumference * cos(latitude) * fitSize / (2 * 2 ^ zoom * mapboxTileSize)
  const canvas = map.getCanvas()
  const padding = 16 * devicePixelRatio
  const fitSize = Math.min(canvas.width, canvas.height) - padding

  const newRadiusRaw = (earthCircumferenceKm * Math.cos((newCenter.lat * Math.PI) / 180) * fitSize) / (2 * 2 ** newZoom * mapboxTileSize)

  if (MAX_RADIUS < newRadiusRaw) {
    return {
      address: null,
      latitude: newCenter.lat,
      longitude: newCenter.lng,
      radius: MAX_RADIUS,
    }
  }

  const containedOptions = RADIUS_OPTIONS_VALUES.filter((option) => newRadiusRaw < option)

  const newRadius = Math.min(...containedOptions)

  return {
    address: null,
    latitude: newCenter.lat,
    longitude: newCenter.lng,
    radius: newRadius,
  }
}

export function RechercheMapIci(props: WithRecherchePageParams<RechercheMapIciProps>) {
  const { map, searchArea, radius } = props

  const [isVisible, setIsVisible] = useState(false)

  const navigateToRecherchePage = useNavigateToRecherchePage(props.params)

  const isSameArea = useCallback(
    (map: Mapbox) => {
      if (radius === null) {
        return true
      }

      const newCenter = map.getCenter()
      const d = newCenter.distanceTo(new LngLat(...searchArea.center)) / 1_000

      // Check if the map is centered on the search area (with a 25% margin)
      if (d > 0.25 * radius) {
        return false
      }

      const newParams = computeNewSearchGeoParams(map)

      return newParams.radius === radius
    },
    [searchArea, radius]
  )

  useEffect(() => {
    if (map == null) {
      return
    }

    const onMove = () => {
      setIsVisible(!isSameArea(map))
    }

    map.on("moveend", onMove)
    map.on("zoomend", onMove)

    return () => {
      map.off("moveend", onMove)
      map.off("zoomend", onMove)
    }
  }, [map, searchArea, isSameArea])

  const onClick = useCallback(() => {
    const params = computeNewSearchGeoParams(map)
    navigateToRecherchePage({ geo: params }, true)
  }, [map, navigateToRecherchePage])

  if (!isVisible) {
    return null
  }

  return (
    <Box
      sx={{
        position: "absolute",
        top: fr.spacing("2w"),
        width: "100%",
        display: "flex",
        justifyContent: "center",
        margin: "0 auto",
      }}
    >
      <Box
        sx={{
          zIndex: 5,
          boxShadow: 2,
          backgroundColor: fr.colors.decisions.background.default.grey.default,
        }}
      >
        <Button iconId="ri-refresh-line" onClick={onClick} priority="tertiary">
          Rechercher dans cette zone
        </Button>
      </Box>
    </Box>
  )
}
