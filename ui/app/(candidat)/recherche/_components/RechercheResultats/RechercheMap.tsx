"use client"

import { Box } from "@mui/material"
import { captureException } from "@sentry/nextjs"
import { Map as Mapbox, type GeoJSONSource, type MapMouseEvent } from "mapbox-gl"
import { useCallback, useEffect, useMemo, useState } from "react"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { RechercheMapIci } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap/RechercheMapIci"
import { RechercheMapPopup } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap/RechercheMapPopup"
import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { useRechercheResults, type ILbaItem, type IUseRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams } from "@/utils/routes.utils"
import "mapbox-gl/dist/mapbox-gl.css"
import { useNavigateToResultItemDetail } from "@/app/(candidat)/recherche/_hooks/useNavigateToResultItemDetail"
import type { ILbaItemSignature } from "@/app/(candidat)/recherche/_hooks/useResultItemUrl"

const FRANCE_CENTER: [number, number] = [2.213749, 46.227638]
const FRANCE_ZOOM = 5

const CLUSTER_MAX_ZOOM = 14

type LAYERS = "formation" | "job" | "selected"

// Persist the map element and the map instance across re-renders
let mapSingleton: Mapbox | null = null

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
  selected: {
    geopoints: "selected-points",
    layer: "selected",
  },
}

export const earthCircumferenceKm = 40075.016686
export const mapboxTileSize = 512

function getBestZoomLevel({ map, latitude, radius }: { map: Mapbox; latitude: number; radius: number }) {
  const canvas = map.getCanvas()
  const padding = 16 * devicePixelRatio
  const fitSize = Math.min(canvas.width, canvas.height) - padding

  // We want to fit 2 * radius in the screen
  //
  // According to https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Resolution_and_Scale we have the following formula:
  //     kmPerPixel = earthCircumferenceKm / mapboxTileSize * cos(latitude) / (2 ^ zoom)
  //        ==> 2 ^ zoom = earthCircumferenceKm * cos(latitude) / (kmPerPixel * mapboxTileSize)
  //        ==> zoom = log2(earthCircumferenceKm * cos(latitude) / (kmPerPixel * mapboxTileSize))
  // As we want to fit 2 * radius in the screen, we have:
  //    fitSize * kmPerPixel = 2 * radius  ==> kmPerPixel = 2 * radius / fitSize
  //
  // ==> zoom = log2(earthCircumference * cos(latitude) / (2 * radius * mapboxTileSize / fitSize))
  //          = log2(earthCircumference * cos(latitude) * fitSize / (2 * radius * mapboxTileSize))

  return Math.log2(Math.abs(earthCircumferenceKm * Math.cos(latitude * Math.PI) * fitSize) / (2 * radius * mapboxTileSize))
}

function useCenterCamera(map: Mapbox | null, params: IRecherchePageParams, selection: ILbaItem[]): { center: [number, number]; zoom: number } {
  const longitude = params.geo?.longitude ?? null
  const latitude = params.geo?.latitude ?? null
  const radius = params.geo?.radius ?? null

  const searchArea: { center: [number, number]; zoom: number } = useMemo(() => {
    const defaultSearchArea = {
      center: FRANCE_CENTER,
      zoom: FRANCE_ZOOM,
    }

    return map === null || longitude == null || latitude == null || radius == null
      ? defaultSearchArea
      : {
          center: [longitude, latitude],
          zoom: getBestZoomLevel({ radius, map, latitude }),
        }
  }, [longitude, latitude, radius, map])

  useEffect(() => {
    if (map === null) {
      return
    }

    map.flyTo(searchArea)
  }, [searchArea, map])

  useEffect(() => {
    if (map === null || selection.length === 0) {
      return
    }

    const target = {
      center: [selection[0].place.longitude, selection[0].place.latitude] as [number, number],
      speed: 0.2,
    }

    if (map.idle()) {
      map.easeTo(target)
      return
    }

    const abortController = new AbortController()

    map.once("idle").then(() => {
      if (abortController.signal.aborted) return
      map.easeTo(target)
    })

    return () => {
      abortController.abort()
    }
  }, [map, selection])

  return searchArea
}

async function loadImage(url: string, id: string, map: Mapbox) {
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

async function createLayer(layer: LAYERS, map: Mapbox) {
  map.addSource(MAP_LAYERS[layer].geopoints, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
    cluster: layer !== "selected",
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
    clusterRadius: 50,
  })

  map.addLayer({
    id: MAP_LAYERS[layer].layer,
    source: MAP_LAYERS[layer].geopoints,
    type: "symbol",
    layout: {
      "icon-image": layer !== "selected" ? layer : ["case", ["boolean", ["==", ["get", "type"], "formation"]], "formation-selected", "job-selected"],
      "icon-size": 1,
      "icon-padding": 0,
      "icon-allow-overlap": true,
    },
  })

  if (layer !== "selected") {
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
}

async function setupMap(container: HTMLDivElement): Promise<Mapbox> {
  if (mapSingleton !== null) {
    console.info("REUSING MAP")
    container.appendChild(mapSingleton.getContainer())
    mapSingleton.resize()

    return mapSingleton
  }
  console.info("NEW MAP")

  const element = globalThis.document.createElement("div")
  element.style.width = "100%"
  element.style.height = "100%"
  container.appendChild(element)

  mapSingleton = new Mapbox({
    accessToken: "pk.eyJ1IjoiYWxhbmxyIiwiYSI6ImNrYWlwYWYyZDAyejQzMHBpYzE0d2hoZWwifQ.FnAOzwsIKsYFRnTUwneUSA",
    container: element,
    style: "mapbox://styles/alanlr/ckkcqqf4e0dxz17r5xa3fkn1f",
    center: FRANCE_CENTER,
    zoom: FRANCE_ZOOM,
  })

  mapSingleton.getCanvas().setAttribute("aria-label", "Localisation géographique des employeurs et/ou formations en alternance")

  await Promise.all([
    loadImage("/images/icons/book.png", "formation", mapSingleton),
    loadImage("/images/icons/job.png", "job", mapSingleton),
    loadImage("/images/icons/book_large_shadow.png", "formation-selected", mapSingleton),
    loadImage("/images/icons/job_large_shadow.png", "job-selected", mapSingleton),
  ])

  // Layout order is important to control the z-index (last added is on top)
  await createLayer("job", mapSingleton)
  await createLayer("formation", mapSingleton)
  await createLayer("selected", mapSingleton)

  if (!mapSingleton.loaded()) { 
    await mapSingleton.once("load")
  }

  return mapSingleton
}

function getItemSourceId(item: ILbaItem, type: LAYERS): string {
  // With 5 digits precision, we can have a 1m precision
  return `${type}:${item.place.longitude.toFixed(5)},${item.place.latitude.toFixed(5)}`
}

/* @ts-ignore TODO */
function buildSourceData<T extends ILbaItem>(items: T[], type: LAYERS): GeoJSON.GeoJSON {
  const groupByPlace = new Map<string, T[]>()
  for (const item of items) {
    if (item.place.longitude == null || item.place.latitude == null) {
      continue
    }

    const key = getItemSourceId(item, type)
    if (!groupByPlace.has(key)) {
      groupByPlace.set(key, [])
    }
    groupByPlace.get(key)!.push(item)
  }

  return {
    type: "FeatureCollection",
    features: Array.from(groupByPlace.entries()).map(([key, itemsInPlace]) => {
      const [longitude, latitude] = key.split(":").at(1).split(",").map(Number)
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        properties: {
          id: key,
          type: itemsInPlace[0].ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? "formation" : "job",
          item_ids: itemsInPlace.map((item) => item.id).join(","),
        },
      }
    }),
  }
}

function setPointOfInterests(map: Mapbox, result: IUseRechercheResults, selection: ILbaItem[]) {
  const selectedIds = new Set(selection.map((item) => item.id))

  const jobs = result.status === "success" ? result.jobs : []
  map.getSource<GeoJSONSource>(MAP_LAYERS.job.geopoints).setData(
    buildSourceData(
      jobs.filter((job) => !selectedIds.has(job.id)),
      "job"
    )
  )

  const formations = result.formationStatus === "success" ? result.formations : []
  map.getSource<GeoJSONSource>(MAP_LAYERS.formation.geopoints).setData(
    buildSourceData(
      formations.filter((formation) => !selectedIds.has(formation.id)),
      "formation"
    )
  )

  map.getSource<GeoJSONSource>(MAP_LAYERS.selected.geopoints).setData(buildSourceData(selection, "selected"))
}

// Force component refresh when using NextJs dev-mode (container reference becomes lost)
// https://nextjs.org/docs/architecture/fast-refresh
// @refresh reset
function useMap(container: HTMLDivElement | null, props: RechercheCarteProps) {
  const params = useCandidatRechercheParams()
  const result = useRechercheResults(params)
  const navigateToRecherchePage = useNavigateToRecherchePage()
  const navigateToResultItemDetail = useNavigateToResultItemDetail()
  const [map, setMap] = useState<Mapbox | null>(null) 

  const updateCandidatSearchParam = useCallback(
    (newParams: Partial<IRecherchePageParams>, replace?: boolean) => {
      if (props.variant === "recherche") {
        navigateToRecherchePage(newParams, replace)
      } else {
        navigateToResultItemDetail(props.item, newParams, replace)
      }
    },
    [navigateToRecherchePage, navigateToResultItemDetail, props.variant, props.item]
  )

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
 
    return () => {
      if (map !== null) {
        map.getContainer().remove()
      }
    }
  }, [container])

  const selection = useMemo(() => {
    const ids = props.item === null ? params.selection : [props.item.id]

    if (ids == null || ids.length === 0) {
      return []
    }

    if (result.status === "success" || result.formationStatus === "success") {
      const items = result.items.filter((i) => ids.includes(i.id))

      return items
    }

    return []
  }, [params.selection, result, props.item])

  useEffect(() => {
    if (map === null) {
      return
    }

    setPointOfInterests(map, result, selection)
  }, [map, result, selection])

  useEffect(() => {
    if (map === null) {
      return
    }

    const zoomIn = (center: [number, number], zoom: number | null = null) => {
      const currentZoom = map.getZoom()

      map.easeTo({
        center,
        speed: 0.2,
        zoom: zoom !== null && zoom > currentZoom ? zoom : currentZoom + 2,
      })
    }

    const onClicked = (e: MapMouseEvent) => {
      if (e.features.length === 0) {
        updateCandidatSearchParam({ selection: [] }, true)
        return
      }

      if (e.features.length > 1 && map.getZoom() < CLUSTER_MAX_ZOOM) {
        zoomIn(e.lngLat.toArray())
        return
      }

      const feature = e.features[0]

      if (feature.properties.cluster) {
       
        map.getSource<GeoJSONSource>(feature.source).getClusterExpansionZoom(
          feature.properties.cluster_id,
          (err, zoom) => {
            if (!err) {
              zoomIn(e.lngLat.toArray(), zoom);
            } else {
              zoomIn(e.lngLat.toArray());
            }
        }
        );
  
        return
      }

      const ids = feature.properties.item_ids.split(",")
      if (props.variant === "detail") {
        navigateToResultItemDetail(
          {
            id: ids[0],
            ideaType: feature.properties.type === "formation" ? LBA_ITEM_TYPE.FORMATION : LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
          },
          {
            selection: ids,
          },
          true
        )
      } else {
        updateCandidatSearchParam({ selection: ids }, true)
      }
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
  }, [map, updateCandidatSearchParam, navigateToResultItemDetail, props.variant])

  const searchArea = useCenterCamera(map, params, selection)

  return { map, selection, searchArea, radius: params.geo?.radius ?? null }
}

type RechercheCarteProps =
  | {
      variant: "recherche"
      item: null
    }
  | {
      variant: "detail"
      item: ILbaItemSignature
    }

export function RechercheCarte(props: RechercheCarteProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  const setContainerRef = useCallback((node) => setContainer(node), [])

  const { map, selection, searchArea, radius } = useMap(container, props)

  return (
    <Box
      ref={setContainerRef}
      sx={{
        background: "center no-repeat url('/images/static_map.svg'), #fff",
        backgroundSize: "auto",
        position: 'relative'
      }}
    >
      <Box
        sx={{
          position: "relative",
        }}
        ref={setContainerRef}
      ></Box>
      {props.variant === "recherche" && <RechercheMapIci map={map} searchArea={searchArea} radius={radius} />}
      <RechercheMapPopup selection={selection} map={map} variant={props.variant} />
    </Box>
  )
}
