import distance from "@turf/distance"
import * as mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { createRoot } from "react-dom/client"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { MapPopup } from "../components/SearchForTrainingsAndJobs/components"
import { fetchAddresses } from "../services/baseAdresse"

import { isArea } from "./isArea"

enum layerType {
  PARTNER = "PARTNER",
  INTERNAL = "INTERNAL",
  TRAINING = "TRAINING",
}

let currentPopup = null
// eslint-disable-next-line import/no-mutable-exports
let map = null
// eslint-disable-next-line import/no-mutable-exports
let isMapInitialized = false

const franceCenter = [2.2, 47]
const zoomWholeFrance = 5

const addLayers = ({ map, type, selectItemOnMap, unselectItem, unselectMapPopupItem, setSelectedItem, setSelectedMapPopupItem }) => {
  let layerName = ""
  switch (type) {
    case layerType.INTERNAL: {
      layerName = "job"
      break
    }
    case layerType.PARTNER: {
      layerName = "partnerJob"
      break
    }
    case layerType.TRAINING: {
      layerName = "training"
      break
    }
    default:
      break
  }

  const clusterCountParams = {
    id: `${layerName}-points-cluster-count`,
    source: `${layerName}-points`,
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
  }

  map.addSource(`${layerName}-points`, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50,
  })

  // Ajout de la layer des emplois en premier pour que les points soient en dessous des formations
  map.addLayer({
    id: `${layerName}-points-layer`,
    source: `${layerName}-points`,
    type: "symbol",
    layout: {
      "icon-image": type === layerType.TRAINING ? "training" : "job", // cf. images chargées en amont
      "icon-padding": 0,
      "icon-allow-overlap": true,
    },
  })

  // layer contenant les pastilles de compte des emplois
  map.addLayer(clusterCountParams)

  map.on("click", `${layerName}-points-layer`, function (e) {
    e.originalEvent.STOP = "STOP" // un classique stopPropagation ne suffit pour empêcher d'ouvrir deux popups si des points de deux layers se superposent
    e.originalEvent.STOP_SOURCE = layerName

    const features = e.features
    setTimeout(() => {
      // setTimeout de 5 ms pour que l'event soit traité au niveau de la layer et que le flag stop puisse être posé
      // afin d'éviter que plusiers popup n'apparaissent si le click a lieu sur plusieurs markers se chevauchant
      if (e?.originalEvent) {
        if (e.originalEvent.STOP_SOURCE === layerName) {
          e.features = features // on réinsert les features de l'event qui sinon sont perdues en raison du setTimeout
          onLayerClick(e, layerName, selectItemOnMap, unselectItem, unselectMapPopupItem, setSelectedItem, setSelectedMapPopupItem)
        }
      }
    }, 5)
  })

  // ajout des layers et events liés à l'item sélectionné
  map.addSource(`selected-${layerName}-point`, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  })

  // Ajout de la layer item sélectionné
  map.addLayer({
    id: `selected-${layerName}-point-layer`,
    source: `selected-${layerName}-point`,
    type: "symbol",
    layout: {
      "icon-image": type === layerType.TRAINING ? "training-large" : "job-large", // cf. images chargées en amont
      "icon-padding": 0,
      "icon-allow-overlap": true,
    },
  })

  map.on("click", `selected-${layerName}-point-layer`, function (e) {
    e.originalEvent.STOP = "STOP" // un classique stopPropagation ne suffit pour empêcher d'ouvrir deux popups si des points de deux layers se superposent
    e.originalEvent.STOP_SOURCE = `selected-${layerName}`
  })
}

const initializeMap = ({ mapContainer, unselectItem, selectItemOnMap, onMapHasMoved, unselectMapPopupItem, setSelectedItem, setSelectedMapPopupItem }) => {
  isMapInitialized = true

  // @ts-ignore TODO
  mapboxgl.accessToken = "pk.eyJ1IjoiYWxhbmxyIiwiYSI6ImNrYWlwYWYyZDAyejQzMHBpYzE0d2hoZWwifQ.FnAOzwsIKsYFRnTUwneUSA"

  map = new mapboxgl.Map({
    container: mapContainer.current,
    style: "mapbox://styles/alanlr/ckkcqqf4e0dxz17r5xa3fkn1f",
    // @ts-ignore TODO
    center: franceCenter,
    zoom: zoomWholeFrance - 2, // hack de contournement du bug d'initialisation de mapbox n'affichant pas les markers sur le niveau de zoom initial (part 1)
    maxZoom: 17,
    minZoom: 3,
    dragRotate: false,
    language: "fr",
    // @ts-ignore TODO
    locale: "fr",
  })

  map._canvas.setAttribute("aria-label", "Localisation géographique des employeurs et/ou formations en alternance")

  map.on("load", async () => {
    map.resize()

    if (!map.hasImage("training")) {
      map.loadImage("/images/icons/book.png", function (error, image) {
        map.addImage("training", image)
      })
    }

    if (!map.hasImage("job")) {
      map.loadImage("/images/icons/job.png", function (error, image) {
        map.addImage("job", image)
      })
    }

    if (!map.hasImage("training-large")) {
      map.loadImage("/images/icons/book_large_shadow.png", function (error, image) {
        map.addImage("training-large", image)
      })
    }

    if (!map.hasImage("job-large")) {
      map.loadImage("/images/icons/job_large_shadow.png", function (error, image) {
        map.addImage("job-large", image)
      })
    }

    if (!map.getLayer("job-points-layer")) {
      addLayers({ map, type: layerType.INTERNAL, selectItemOnMap, unselectItem, unselectMapPopupItem, setSelectedItem, setSelectedMapPopupItem })
      addLayers({ map, type: layerType.PARTNER, selectItemOnMap, unselectItem, unselectMapPopupItem, setSelectedItem, setSelectedMapPopupItem })
    }

    // ajout des layers et events liés aux formations
    if (!map.getLayer("training-points-layer")) {
      addLayers({ map, type: layerType.TRAINING, selectItemOnMap, unselectItem, unselectMapPopupItem, setSelectedItem, setSelectedMapPopupItem })
    }
  })

  map.on("move", () => {
    onMapHasMoved({
      lon: map.getCenter().lng.toFixed(4),
      lat: map.getCenter().lat.toFixed(4),
      zoom: map.getZoom().toFixed(2),
    })
  })

  // log vers google analytics de l'utilisation du bouton zoom / dézoom
  map.on("zoomend", () => {
    if (map.getZoom() < 9) closeMapPopups()
  })

  const nav = new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false })
  map.addControl(nav, "bottom-right")
}

const onLayerClick = (e, layer, selectItemOnMap, unselectItem, unselectMapPopupItem, setSelectedItem, setSelectedMapPopupItem) => {
  const coordinates = e.features[0].geometry.coordinates.slice()

  // si cluster on a properties: {cluster: true, cluster_id: 125, point_count: 3, point_count_abbreviated: 3}
  // sinon on a properties : { training|job }

  if (e.features[0].properties.cluster) {
    let zoom = map.getZoom()

    if (zoom > 11) zoom += 2
    else if (zoom > 9) zoom += 3
    else zoom += 4

    map.easeTo({ center: coordinates, speed: 0.2, zoom })
  } else {
    const item = layer === "training" ? JSON.parse(e.features[0].properties.training) : JSON.parse(e.features[0].properties.job)

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
    }

    currentPopup = new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setDOMContent(buildPopup({ item, type: item.ideaType, selectItemOnMap, setSelectedItem, setSelectedMapPopupItem }))
      .addTo(map)

    currentPopup.on("close", function () {
      setSelectedMarker(null)
      unselectMapPopupItem()
    })

    unselectItem()
    const realItem = item.items ? item.items[0] : item
    dispatchScrollToItem(realItem)
    setSelectedMarker(item)
  }
}

const dispatchScrollToItem = (item) => {
  try {
    const element = document.getElementById("resultList")
    element.dispatchEvent(new CustomEvent("scrollToItem", { detail: { itemId: item.id } }))
  } catch (error) {
    console.error(error)
  }
}

const flyToMarker = (item, zoom = map.getZoom()) => {
  if (isMapInitialized) {
    map.easeTo({ center: [item.place.longitude, item.place.latitude], speed: 0.2, zoom })
  }
}

const flyToLocation = (location) => {
  if (isMapInitialized) {
    map.flyTo(location)
  }
}

const flyToCenter = (values) => {
  const searchCenter = values?.location?.value ? [values.location.value.coordinates[0], values.location.value.coordinates[1]] : null

  if (searchCenter) {
    flyToLocation({ center: searchCenter, zoom: 10 })
  } else {
    flyToLocation({ center: coordinatesOfFrance, zoom: 4 })
  }
}

const buildPopup = ({ item, type, selectItemOnMap, setSelectedItem, setSelectedMapPopupItem }) => {
  const popupNode = document.createElement("div")
  const root = createRoot(popupNode)
  root.render(<MapPopup handleSelectItem={selectItemOnMap} setSelectedItem={setSelectedItem} setSelectedMapPopupItem={setSelectedMapPopupItem} type={type} item={item} />)
  return popupNode
}

const closeMapPopups = () => {
  if (isMapInitialized && currentPopup) {
    currentPopup.remove()
    currentPopup = null
  }
}

const getZoomLevelForDistance = (distance) => {
  let zoom = 10

  if (distance > 10) {
    if (distance < 20) zoom = 9
    else if (distance < 50) zoom = 8
    else if (distance < 100) zoom = 7
    else if (distance < 250) zoom = 6
    else if (distance < 500) zoom = 5
    else if (distance >= 500) zoom = 4
  }

  return zoom
}

// rassemble les éléments à la même adresse dans un même marker
const factorPlacesForMap = (list) => {
  // réduction de la liste en rassemblant les emplois au même endroit sous un seul item
  let currentMarker = null
  const resultList = []

  for (let i = 0; i < list.length; ++i) {
    const coords = getCoordinates(list[i])

    if (!currentMarker) currentMarker = { coords, items: [list[i]] }
    else {
      if (!isEqualCoords(currentMarker.coords, coords)) {
        resultList.push(currentMarker)
        currentMarker = { coords, items: [list[i]] }
      } else {
        currentMarker.items.push(list[i])
      }
    }
  }

  if (currentMarker) {
    resultList.push(currentMarker)
  }

  return resultList
}

// rassemble les formations ayant lieu dans un même établissement pour avoir une seule icône sur la map
const factorTrainingsForMap = (list) => {
  return factorPlacesForMap(list)
}

const factorInternalJobsForMap = (lists) => {
  return factorJobsForMap(lists, layerType.INTERNAL)
}

// rassemble les emplois internes ayant une même géoloc pour avoir une seule icône sur la map
const factorJobsForMap = (lists, type) => {
  let sortedList = []

  if (type === layerType.PARTNER) {
    sortedList = sortedList.concat(lists.peJobs ?? [])
  } else {
    sortedList = sortedList
      .concat(lists.lbaCompanies ?? [])
      .concat(lists.matchas ?? [])
      .concat(lists.partnerJobs ?? [])
  }

  // tri de la liste de tous les emplois selon les coordonnées geo (l'objectif est d'avoir les emplois au même lieu proches)
  sortedList.sort((a, b) => {
    const coordA = getFlatCoords(a)
    const coordB = getFlatCoords(b)

    if (coordA < coordB) return -1
    else return 1
  })

  // réduction de la liste en rassemblant les emplois au même endroit sous un seul item
  return factorPlacesForMap(sortedList)
}

// en entrée tableaux [lon,lat]
const isEqualCoords = (coordsA, coordsB) => {
  if (coordsA && coordsB && coordsA[0] === coordsB[0] && coordsA[1] === coordsB[1]) return true
  else return false
}

const getCoordinates = (item) => {
  let coords = null
  if (item?.place?.longitude !== undefined) {
    coords = [item.place.longitude, item.place.latitude]
  } else if (item?.coords) {
    coords = item.coords
  }

  return coords
}

// utile uniquement pour le tri par coordonnées
const getFlatCoords = (item) => {
  const coords = getCoordinates(item)

  return coords ? "" + coords[0] + "," + coords[1] : null
}

const computeMissingPositionAndDistance = async (searchCenter, jobs) => {
  // calcule et affectation aux offres PE de la distances du centre de recherche dans les cas où la donnée est incomplète

  await Promise.all(
    jobs.map(async (job) => {
      if (job.place && !job.place.longitude && !job.place.latitude && (job.place.city || job.place.address)) {
        let addresses = null

        if (job.place.city) {
          let city = job.place.city // complétion du numéro du département pour réduire les résultats erronés (ex : Saint Benoit à la réunion pour 86 - ST BENOIT)
          let dpt = city.substring(0, 2)
          let area = null

          if (isNaN(dpt)) {
            // ex : Ile-de-France
            area = isArea(city)
          } else if (city[3] === "-") {
            // ex : 75 - Paris (Dept.)
            area = isArea(dpt)
          }
          //else ex : 69 Lyon

          if (area) {
            addresses = [
              {
                value: { coordinates: [area.lon, area.lat] },
              },
            ]
          } else {
            dpt += "000"
            city = dpt + city.substring(2)
            addresses = await fetchAddresses(city, "municipality") // on force à Municipality pour ne pas avoir des rues dans de mauvaise localités
          }
        } else {
          addresses = await fetchAddresses(job.place.address, "municipality") // on force à Municipality pour ne pas avoir des rues dans de mauvaise localités
        }

        if (addresses.length) {
          job.place.longitude = addresses[0].value.coordinates[0]
          job.place.latitude = addresses[0].value.coordinates[1]
          if (searchCenter) {
            job.place.distance = Math.round(distance(searchCenter, [job.place.longitude, job.place.latitude]))
          }
        }
      }
    })
  )

  return jobs
}

const filterLayers = (filters) => {
  if (isMapInitialized) {
    let layersToShow = []
    let layersToHide = []

    if (filters.includes("jobs") || filters.includes("duo")) {
      layersToShow = layersToShow.concat(["job-points-cluster-count", "job-points-layer", "partnerJob-points-cluster-count", "partnerJob-points-layer"])
    } else {
      layersToHide = layersToHide.concat(["job-points-cluster-count", "job-points-layer", "partnerJob-points-cluster-count", "partnerJob-points-layer"])
    }

    if (filters.includes("trainings")) {
      layersToShow = layersToShow.concat(["training-points-cluster-count", "training-points-layer"])
    } else {
      layersToHide = layersToHide.concat(["training-points-cluster-count", "training-points-layer"])
    }

    layersToHide.map((layerId) => {
      map.setLayoutProperty(layerId, "visibility", "none")
    })
    layersToShow.map((layerId) => {
      map.setLayoutProperty(layerId, "visibility", "visible")
    })
  }
}

const waitForMapReadiness = async () => {
  while (
    !map.getLayer("job-points-layer") ||
    !map.getLayer("training-points-layer") // attente que la map soit prête
  ) {
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  return
}

const resizeMap = () => {
  if (isMapInitialized) {
    map.resize()
  }
}

const setJobMarkers = async ({ jobList, type, searchCenter = null, hasTrainings = false, tryCount = 0 }) => {
  if (isMapInitialized) {
    await waitForMapReadiness()

    // centrage et zoom si searchCenter est précisé (scope emploi seulement)
    if (!hasTrainings) {
      if (searchCenter) {
        map.flyTo({ center: searchCenter, zoom: 9 })
      } else {
        // hack de contournement du bug d'initialisation de mapbox n'affichant pas les markers sur le niveau de zoom initial (part 2)
        map.flyTo({ center: franceCenter, zoom: zoomWholeFrance })
      }
    }

    const features = []
    jobList.map((job, idx) => {
      job.ideaType = job.ideaType === LBA_ITEM_TYPE_OLD.PEJOB ? "partnerJob" : "job"

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: job.coords,
        },
        properties: {
          id: idx,
          job,
        },
      })
    })

    map.getSource(type === layerType.INTERNAL ? "job-points" : "partnerJob-points").setData({ type: "FeatureCollection", features })
  } else {
    if (tryCount < 5) {
      setTimeout(() => {
        setJobMarkers({ jobList, type, searchCenter, hasTrainings, tryCount: tryCount++ })
      }, 100)
    }
  }
}

const setSelectedMarker = async (item) => {
  const marker: { coords: any; items: any[]; ideaType: string } | null = item
    ? {
        coords: getCoordinates(item),
        items: [item],
        ideaType: item.ideaType,
      }
    : null

  setSelectedJobMarker(item && item.ideaType !== LBA_ITEM_TYPE_OLD.FORMATION ? marker : null)
  setSelectedTrainingMarker(item && item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? marker : null)
}

const setSelectedJobMarker = async (marker) => {
  updateSelectedMarkerCollection(marker && marker.ideaType === LBA_ITEM_TYPE_OLD.PEJOB ? marker : null, "selected-partnerJob-point")
  updateSelectedMarkerCollection(marker && marker.ideaType !== LBA_ITEM_TYPE_OLD.PEJOB ? marker : null, "selected-job-point")
}

const setSelectedTrainingMarker = async (marker) => {
  updateSelectedMarkerCollection(marker, "selected-training-point")
}

const updateSelectedMarkerCollection = async (item, layer) => {
  if (isMapInitialized) {
    await waitForMapReadiness()

    const features = []
    if (item) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: item.coords,
        },
        properties: {
          id: 0,
          ...(item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION ? { training: item } : { job: item }),
        },
      })
    }

    const results = { type: "FeatureCollection", features }
    map.getSource(layer).setData(results)
  }
}

const setTrainingMarkers = async ({ trainingList, options = undefined, tryCount = 0 }) => {
  if (isMapInitialized) {
    await waitForMapReadiness()

    const features = []

    if (trainingList?.length) {
      if (!options || options.centerMapOnTraining) {
        // centrage sur formation la plus proche
        const newZoom = getZoomLevelForDistance(trainingList[0].items[0].place.distance)
        map.flyTo({ center: trainingList[0].coords, zoom: newZoom })
      } else {
        // hack de contournement du bug d'initialisation de mapbox n'affichant pas les markers sur le niveau de zoom initial (part 3)
        map.flyTo({ center: franceCenter, zoom: zoomWholeFrance })
      }

      trainingList.map((training, idx) => {
        training.ideaType = LBA_ITEM_TYPE_OLD.FORMATION
        features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: training.coords,
          },
          properties: {
            id: idx,
            training,
          },
        })
      })
    }

    map.getSource("training-points").setData({ type: "FeatureCollection", features })
  } else {
    if (tryCount < 5)
      setTimeout(() => {
        setTrainingMarkers({ trainingList, options, tryCount: tryCount++ })
      }, 100)
  }
}

const coordinatesOfFrance = [2.213749, 46.227638]

const refreshLocationMarkers = ({ jobs, trainings, scopeContext }) => {
  setTimeout(() => {
    if (scopeContext.isJob) {
      setJobMarkers({ jobList: factorInternalJobsForMap(jobs), type: layerType.INTERNAL, hasTrainings: !!trainings })
    }
    if (scopeContext.isTraining) {
      setTrainingMarkers({ trainingList: factorTrainingsForMap(trainings) })
    }
  }, 1000)
}

export {
  buildPopup,
  closeMapPopups,
  computeMissingPositionAndDistance,
  coordinatesOfFrance,
  factorInternalJobsForMap,
  factorTrainingsForMap,
  filterLayers,
  flyToLocation,
  flyToMarker,
  flyToCenter,
  getZoomLevelForDistance,
  initializeMap,
  isMapInitialized,
  layerType,
  map,
  refreshLocationMarkers,
  resizeMap,
  setJobMarkers,
  setSelectedJobMarker,
  setSelectedMarker,
  setSelectedTrainingMarker,
  setTrainingMarkers,
  waitForMapReadiness,
}
