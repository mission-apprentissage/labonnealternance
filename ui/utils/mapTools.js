import React from "react"
import distance from "@turf/distance"
import { MapPopup } from "../components/SearchForTrainingsAndJobs/components"
import ReactDOM from "react-dom"
import * as mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { fetchAddresses } from "../services/baseAdresse"
import { scrollToElementInContainer, getItemElement } from "./tools"
import { isArea } from "./isArea"

let currentPopup = null
let map = null
let isMapInitialized = false

const franceCenter = [2.2, 47]
const zoomWholeFrance = 5

const initializeMap = ({ mapContainer, unselectItem, selectItemOnMap, onMapHasMoved, unselectMapPopupItem, setSelectedItem, setSelectedMapPopupItem }) => {
  isMapInitialized = true

  mapboxgl.accessToken = "pk.eyJ1IjoiYWxhbmxyIiwiYSI6ImNrYWlwYWYyZDAyejQzMHBpYzE0d2hoZWwifQ.FnAOzwsIKsYFRnTUwneUSA"

  map = new mapboxgl.Map({
    container: mapContainer.current,
    style: "mapbox://styles/alanlr/ckkcqqf4e0dxz17r5xa3fkn1f",
    center: franceCenter,
    zoom: zoomWholeFrance - 2, // hack de contournement du bug d'initialisation de mapbox n'affichant pas les markers sur le niveau de zoom initial (part 1)
    maxZoom: 17,
    minZoom: 3,
    dragRotate: false,
  })

  map.on("load", async () => {
    map.resize()

    if (!map.hasImage("training")) {
      map.loadImage("/images/icons/book.png", function (error, image) {
        if (error) throw error
        map.addImage("training", image)
      })
    }

    if (!map.hasImage("job")) {
      map.loadImage("/images/icons/job.png", function (error, image) {
        if (error) throw error
        map.addImage("job", image)
      })
    }

    if (!map.hasImage("training-large")) {
      map.loadImage("/images/icons/book_large_shadow.png", function (error, image) {
        if (error) throw error
        map.addImage("training-large", image)
      })
    }

    if (!map.hasImage("job-large")) {
      map.loadImage("/images/icons/job_large_shadow.png", function (error, image) {
        if (error) throw error
        map.addImage("job-large", image)
      })
    }

    let clusterCountParams = {
      id: "job-points-cluster-count",
      source: "job-points",
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

    if (!map.getLayer("job-points-layer")) {
      map.addSource("job-points", {
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
        id: "job-points-layer",
        source: "job-points",
        type: "symbol",
        layout: {
          "icon-image": "job", // cf. images chargées plus haut
          "icon-padding": 0,
          "icon-allow-overlap": true,
        },
      })

      map.on("click", "job-points-layer", function (e) {
        const features = e.features
        setTimeout(() => {
          // setTimeout de 5 ms pour que l'event soit traité au niveau de la layer training et que le flag stop puisse être posé
          // en effet la layer job reçoit l'event en premier du fait de son positionnement dans la liste des layers de la map
          if (e?.originalEvent) {
            if (!e.originalEvent.STOP) {
              e.features = features // on réinsert les features de l'event qui sinon sont perdues en raison du setTimeout
              onLayerClick(e, "job", selectItemOnMap, unselectItem, unselectMapPopupItem, setSelectedItem, setSelectedMapPopupItem)
            }
          }
        }, 5)
      })

      // layer contenant les pastilles de compte des emplois
      map.addLayer(clusterCountParams)

      // ajout des layers et events liés à l'emploi sélectionné
      map.addSource("selected-job-point", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      })

      // Ajout de la layer emploi sélectionné
      map.addLayer({
        id: "selected-job-point-layer",
        source: "selected-job-point",
        type: "symbol",
        layout: {
          "icon-image": "job-large", // cf. images chargées plus haut
          "icon-padding": 0,
          "icon-allow-overlap": true,
        },
      })

      map.on("click", "selected-job-point-layer", function (e) {
        e.originalEvent.STOP = "STOP" // un classique stopPropagation ne suffit pour empêcher d'ouvrir deux popups si des points de deux layers se superposent
        e.originalEvent.STOP_SOURCE = "selected-job"
      })
    }

    // ajout des layers et events liés aux formations
    if (!map.getLayer("training-points-layer")) {
      map.addSource("training-points", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50,
      })

      // Ajout de la layer des formations
      map.addLayer({
        id: "training-points-layer",
        source: "training-points",
        type: "symbol",
        layout: {
          "icon-image": "training", // cf. images chargées plus haut
          "icon-padding": 0,
          "icon-allow-overlap": true,
        },
      })

      clusterCountParams.id = "training-points-cluster-count"
      clusterCountParams.source = "training-points"

      map.addLayer(clusterCountParams)

      map.on("click", "training-points-layer", function (e) {
        e.originalEvent.STOP = "STOP" // un classique stopPropagation ne suffit pour empêcher d'ouvrir deux popups si des points de deux layers se superposent

        const features = e.features
        setTimeout(() => {
          // setTimeout de 5 ms pour que l'event soit traité au niveau de la layer training et que le flag stop puisse être posé
          // en effet la layer job reçoit l'event en premier du fait de son positionnement dans la liste des layers de la map
          if (e?.originalEvent) {
            if (!e.originalEvent.STOP_SOURCE) {
              e.features = features // on réinsert les features de l'event qui sinon sont perdues en raison du setTimeout
              onLayerClick(e, "training", selectItemOnMap, unselectItem, unselectMapPopupItem, setSelectedItem, setSelectedMapPopupItem)
            }
          }
        }, 5)
      })

      // ajout des layers et events liés à la formation sélectionnée
      map.addSource("selected-training-point", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      })

      // Ajout de la layer formation sélectionnée
      map.addLayer({
        id: "selected-training-point-layer",
        source: "selected-training-point",
        type: "symbol",
        layout: {
          "icon-image": "training-large", // cf. images chargées plus haut
          "icon-padding": 0,
          "icon-allow-overlap": true,
        },
      })

      map.on("click", "selected-training-point-layer", function (e) {
        e.originalEvent.STOP = "STOP" // un classique stopPropagation ne suffit pour empêcher d'ouvrir deux popups si des points de deux layers se superposent
        e.originalEvent.STOP_SOURCE = "selected-training"
      })
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
  map.on("zoomend", (e) => {
    if (map.getZoom() < 9) closeMapPopups()
  })

  const nav = new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false })
  map.addControl(nav, "bottom-right")
}

const onLayerClick = (e, layer, selectItemOnMap, unselectItem, unselectMapPopupItem, setSelectedItem, setSelectedMapPopupItem) => {
  let coordinates = e.features[0].geometry.coordinates.slice()

  // si cluster on a properties: {cluster: true, cluster_id: 125, point_count: 3, point_count_abbreviated: 3}
  // sinon on a properties : { training|job }

  if (e.features[0].properties.cluster) {
    let zoom = map.getZoom()

    if (zoom > 11) zoom += 2
    else if (zoom > 9) zoom += 3
    else zoom += 4

    map.easeTo({ center: coordinates, speed: 0.2, zoom })
  } else {
    let item = layer === "training" ? JSON.parse(e.features[0].properties.training) : JSON.parse(e.features[0].properties.job)

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

    currentPopup.on("close", function (e) {
      setSelectedMarker(null)
      unselectMapPopupItem()
    })

    unselectItem()
    scrollToElementInContainer("resultList", getItemElement(item), 150, "smooth")
    setSelectedMarker(item)
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

const buildPopup = ({ item, type, selectItemOnMap, setSelectedItem, setSelectedMapPopupItem }) => {
  const popupNode = document.createElement("div")

  ReactDOM.render(
    <MapPopup handleSelectItem={selectItemOnMap} setSelectedItem={setSelectedItem} setSelectedMapPopupItem={setSelectedMapPopupItem} type={type} item={item} />,
    popupNode
  )

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
  let resultList = []

  for (let i = 0; i < list.length; ++i) {
    let coords = getCoordinates(list[i])

    if (!currentMarker) currentMarker = { coords, items: [list[i]] }
    else {
      if (!isEqualCoords(currentMarker.coords, coords)) {
        resultList.push(currentMarker)
        currentMarker = { coords, items: [list[i]] }
      } else currentMarker.items.push(list[i])
    }
  }

  if (currentMarker) resultList.push(currentMarker)

  return resultList
}

// rassemble les formations ayant lieu dans un même établissement pour avoir une seule icône sur la map
const factorTrainingsForMap = (list) => {
  return factorPlacesForMap(list)
}

// rassemble les emplois ayant une même géoloc pour avoir une seule icône sur la map
const factorJobsForMap = (lists) => {
  let sortedList = []

  // concaténation des quatre sources d'emploi
  if (lists.peJobs) {
    sortedList = lists.peJobs
  }

  if (lists.lbbCompanies) {
    sortedList = sortedList.length ? sortedList.concat(lists.lbbCompanies) : lists.lbbCompanies
  }

  if (lists.lbaCompanies) {
    sortedList = sortedList.length ? sortedList.concat(lists.lbaCompanies) : lists.lbaCompanies
  }

  if (lists.matchas) {
    sortedList = sortedList.length ? sortedList.concat(lists.matchas) : lists.matchas
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
            job.place.distance = Math.round(10 * distance(searchCenter, [job.place.longitude, job.place.latitude])) / 10
          }
        }
      }
    })
  )

  return jobs
}

const filterLayers = (filter) => {
  if (isMapInitialized) {
    let layersToShow = []
    let layersToHide = []
    if (filter === "all") layersToShow = ["training-points-cluster-count", "training-points-layer", "job-points-cluster-count", "job-points-layer"]
    if (filter === "jobs") {
      layersToShow = ["job-points-cluster-count", "job-points-layer"]
      layersToHide = ["training-points-cluster-count", "training-points-layer"]
    }
    if (filter === "trainings") {
      layersToHide = ["job-points-cluster-count", "job-points-layer"]
      layersToShow = ["training-points-cluster-count", "training-points-layer"]
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

const setJobMarkers = async ({ jobList, searchCenter = null, hasTrainings = false, tryCount = 0 }) => {
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

    let features = []
    jobList.map((job, idx) => {
      job.ideaType = "job"

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

    map.getSource("job-points").setData({ type: "FeatureCollection", features })
  } else {
    if (tryCount < 5)
      setTimeout(() => {
        setJobMarkers({ jobList, searchCenter, hasTrainings, tryCount: tryCount++ })
      }, 100)
  }
}

const setSelectedMarker = async (item) => {
  if (item) {
    let marker = { coords: getCoordinates(item), items: [item] }

    if (item.ideaType === "formation") {
      marker.ideaType = "formation"
      setSelectedTrainingMarker(marker)
      setSelectedJobMarker(marker)
    } else {
      marker.ideaType = "job"
      setSelectedJobMarker(marker)
      setSelectedTrainingMarker(null)
    }
  } else {
    setSelectedJobMarker(null)
    setSelectedTrainingMarker(null)
  }
}

const setSelectedJobMarker = async (job, searchCenter) => {
  updateSelectedMarkerCollection(job, "selected-job-point", searchCenter)
}

const setSelectedTrainingMarker = async (training, searchCenter) => {
  updateSelectedMarkerCollection(training, "selected-training-point", searchCenter)
}

const updateSelectedMarkerCollection = async (item, layer) => {
  if (isMapInitialized) {
    await waitForMapReadiness()

    let features = []
    if (item) {
      let feature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: item.coords,
        },
        properties: {
          id: 0,
        },
      }

      if (item.ideaType === "formation") {
        feature.properties.training = item
      } else {
        feature.properties.job = item
      }

      features.push(feature)
    }

    let results = { type: "FeatureCollection", features }

    map.getSource(layer).setData(results)
  }
}

const setTrainingMarkers = async ({ trainingList, options, tryCount = 0 }) => {
  if (isMapInitialized) {
    await waitForMapReadiness()

    let features = []

    if (trainingList?.length) {
      if (!options || options.centerMapOnTraining) {
        // centrage sur formation la plus proche
        let newZoom = getZoomLevelForDistance(trainingList[0].items[0].place.distance)
        map.flyTo({ center: trainingList[0].coords, zoom: newZoom })
      } else {
        // hack de contournement du bug d'initialisation de mapbox n'affichant pas les markers sur le niveau de zoom initial (part 3)
        map.flyTo({ center: franceCenter, zoom: zoomWholeFrance })
      }

      trainingList.map((training, idx) => {
        training.ideaType = "formation"
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

export {
  map,
  isMapInitialized,
  resizeMap,
  buildPopup,
  initializeMap,
  flyToMarker,
  flyToLocation,
  closeMapPopups,
  getZoomLevelForDistance,
  factorTrainingsForMap,
  factorJobsForMap,
  computeMissingPositionAndDistance,
  filterLayers,
  waitForMapReadiness,
  setTrainingMarkers,
  setJobMarkers,
  setSelectedJobMarker,
  setSelectedTrainingMarker,
  setSelectedMarker,
  coordinatesOfFrance,
}
