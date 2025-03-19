"use client"

import { Box } from "@mui/material"
import { captureException } from "@sentry/nextjs"
import { Map, type GeoJSONSource, type MapMouseEvent } from "mapbox-gl"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { ILbaItemFormation, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { RechercheMapPopup } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap/RechercheMapPopup"
import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { useRechercheResults, type IUseRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { useUpdateCandidatSearchParam } from "@/app/(candidat)/recherche/_hooks/useUpdateCandidatSearchParam"
import type { IRecherchePageParams } from "@/utils/routes.utils"

const FRANCE_CENTER: [number, number] = [2.213749, 46.227638]
const FRANCE_ZOOM = 5

const CLUSTER_MAX_ZOOM = 14

type LAYERS = "formation" | "job" | "selected"

const MAP_LAYERS = {
  formation: {
    geopoints: "formation-points",
    layer: "formation",
    count: "formation-count",
  },
  job: {
    geopoints: "job-points",
    layer: "job",
    count: "job-count",
  },
}

function useCenterCamera(map: Map | null, params: IRecherchePageParams, selected: ILbaItemLbaCompany | ILbaItemPartnerJob | ILbaItemFormation | ILbaItemLbaJob | null) {
  const longitude = params.geo?.longitude ?? null
  const latitude = params.geo?.latitude ?? null

  useEffect(() => {
    if (map === null) {
      return
    }

    map.flyTo(
      longitude == null && latitude == null
        ? {
            center: FRANCE_CENTER,
            zoom: FRANCE_ZOOM,
          }
        : {
            center: [longitude, latitude],
            // TODO: use a better zoom according to radius?
            zoom: 10,
          }
    )
  }, [longitude, latitude, map])

  useEffect(() => {
    if (map === null || selected === null) {
      return
    }

    if (map.idle()) {
      map.easeTo({
        center: [selected.place.longitude, selected.place.latitude],
        speed: 0.2,
        zoom: Math.max(map.getZoom(), 13),
      })
      return
    }

    const abortController = new AbortController()

    map.once("idle").then(() => {
      if (abortController.signal.aborted) return

      map.easeTo({
        center: [selected.place.longitude, selected.place.latitude],
        speed: 0.2,
        zoom: Math.max(map.getZoom(), 14),
      })
    })

    return () => {
      abortController.abort()
    }
  }, [map, selected])
}

async function loadImage(url: string, id: string, map: Map) {
  if (map.hasImage(id)) {
    return
  }

  return new Promise((resolve, reject) => {
    map.loadImage(url, (error, image) => {
      if (error) {
        reject(error)
      } else {
        map.addImage(id, image)
        resolve(undefined)
      }
    })
  })
}

async function createLayer(layer: LAYERS, map: Map) {
  map.addSource(MAP_LAYERS[layer].geopoints, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
    cluster: true,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
    clusterRadius: 50,
  })

  map.addLayer({
    id: MAP_LAYERS[layer].layer,
    source: MAP_LAYERS[layer].geopoints,
    type: "symbol",
    layout: {
      "icon-image": `${layer}-selected`,
      "icon-size": ["case", ["boolean", ["get", "selected"], false], 1, 0.6],
      "icon-padding": 0,
      "icon-allow-overlap": true,
    },
  })

  map.addLayer({
    id: MAP_LAYERS[layer].count,
    source: MAP_LAYERS[layer].geopoints,
    type: "symbol",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["Arial Unicode MS Bold"],
      "text-size": 14,
      "text-anchor": "top-left",
      "text-allow-overlap": true,
      "text-offset": [0.4, 0.2],
    },
    paint: {
      "text-color": "#fff",
      "text-halo-color": "#000",
      "text-halo-width": 3,
    },
  })
}

async function setupMap(container: HTMLDivElement): Promise<Map> {
  const map = new Map({
    accessToken: "pk.eyJ1IjoiYWxhbmxyIiwiYSI6ImNrYWlwYWYyZDAyejQzMHBpYzE0d2hoZWwifQ.FnAOzwsIKsYFRnTUwneUSA",
    container,
    style: "mapbox://styles/mapbox/streets-v11",
    center: FRANCE_CENTER,
    zoom: FRANCE_ZOOM,
  })

  map.getCanvas().setAttribute("aria-label", "Localisation géographique des employeurs et/ou formations en alternance")

  await Promise.all([
    loadImage("/images/icons/book.png", "formation", map),
    loadImage("/images/icons/job.png", "job", map),
    loadImage("/images/icons/book_large_shadow.png", "formation-selected", map),
    loadImage("/images/icons/job_large_shadow.png", "job-selected", map),
  ])

  // Layout order is important to control the z-index (last added is on top)
  await createLayer("job", map)
  await createLayer("formation", map)

  return map
}

function setPointOfInterests(map: Map, result: IUseRechercheResults, params: IRecherchePageParams) {
  const jobs = result.status === "success" ? result.jobs : []

  map.getSource<GeoJSONSource>(MAP_LAYERS.job.geopoints).setData({
    type: "FeatureCollection",
    features: jobs
      .filter((job) => job.place && job.place.longitude != null && job.place.latitude != null)
      .map((job) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [job.place.longitude, job.place.latitude],
        },
        properties: {
          id: job.id,
          selected: params.selection?.includes(job.id) || false,
        },
      })),
  })

  const formations = result.formationStatus === "success" ? result.formations : []

  map.getSource<GeoJSONSource>(MAP_LAYERS.formation.geopoints).setData({
    type: "FeatureCollection",
    features: formations
      .filter((formation) => formation.place && formation.place.longitude != null && formation.place.latitude != null)
      .map((formation) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [formation.place.longitude, formation.place.latitude],
        },
        properties: {
          id: formation.id,
          selected: params.selection?.includes(formation.id) || false,
        },
      })),
  })
}

function useMap(container: HTMLDivElement | null) {
  const params = useCandidatRechercheParams()
  const result = useRechercheResults(params)
  const updateCandidatSearchParam = useUpdateCandidatSearchParam()
  const [map, setMap] = useState<Map | null>(null)

  useEffect(() => {
    if (container === null) {
      return
    }

    setupMap(container)
      .then(setMap)
      .catch((error) => {
        // TODO: error handler
        captureException(error)
      })
  }, [container])

  useEffect(() => {
    if (map === null) {
      return
    }

    setPointOfInterests(map, result, params)
  }, [map, result, params])

  useEffect(() => {
    if (map === null) {
      return
    }

    const zoomIn = (center: [number, number]) => {
      const currentZoom = map.getZoom()

      map.easeTo({
        center,
        speed: 0.2,
        zoom: currentZoom + 2,
      })
    }

    const onClicked = (e: MapMouseEvent) => {
      if (e.features.length === 0) {
        updateCandidatSearchParam({ selection: [] }, true)
        return
      }

      if (e.features.length > 1 && map.getZoom() < CLUSTER_MAX_ZOOM) {
        updateCandidatSearchParam({ selection: [] }, true)
        zoomIn(e.lngLat.toArray())
        return
      }

      const feature = e.features[0]

      if (feature.properties.cluster) {
        updateCandidatSearchParam({ selection: [] }, true)
        zoomIn(e.lngLat.toArray())
        return
      }

      updateCandidatSearchParam({ selection: [feature.properties.id] }, true)
    }

    const onMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer"
    }

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = ""
    }

    map.on("click", [MAP_LAYERS.job.layer, MAP_LAYERS.formation.layer], onClicked)
    map.on("mouseenter", [MAP_LAYERS.job.layer, MAP_LAYERS.formation.layer], onMouseEnter)
    map.on("mouseleave", [MAP_LAYERS.job.layer, MAP_LAYERS.formation.layer], onMouseLeave)

    return () => {
      map.off("click", [MAP_LAYERS.job.layer, MAP_LAYERS.formation.layer], onClicked)
      map.off("mouseenter", [MAP_LAYERS.job.layer, MAP_LAYERS.formation.layer], onMouseEnter)
      map.off("mouseleave", [MAP_LAYERS.job.layer, MAP_LAYERS.formation.layer], onMouseLeave)
    }
  }, [map, updateCandidatSearchParam])

  const selectedItem = useMemo(() => {
    if (params.selection == null || params.selection.length === 0) {
      return null
    }

    if (result.status === "success" || result.formationStatus === "success") {
      const item = result.items.find((i) => params.selection?.includes(i.id))
      if (!item) {
        return null
      }

      return item
    }

    return null
  }, [params.selection, result])

  useCenterCamera(map, params, selectedItem)

  useEffect(() => {
    if (map === null || selectedItem === null) {
      return
    }

    map.setFeatureState(
      {
        source: selectedItem.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? MAP_LAYERS.formation.geopoints : MAP_LAYERS.job.geopoints,
        id: selectedItem.id,
      },
      { selected: true }
    )

    return () => {
      map.removeFeatureState({
        source: selectedItem.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? MAP_LAYERS.formation.geopoints : MAP_LAYERS.job.geopoints,
        id: selectedItem.id,
      })
    }
  }, [selectedItem, map])

  return { map, selectedItem }
}

export function RechercheCarte() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  const setContainerRef = useCallback((node) => setContainer(node), [])

  const { map, selectedItem } = useMap(container)

  return (
    <>
      <Box
        ref={setContainerRef}
        sx={{
          background: "center no-repeat url('/images/static_map.svg'), #fff",
          backgroundSize: "auto",
        }}
      ></Box>
      <RechercheMapPopup item={selectedItem} map={map} />
    </>
  )
}
