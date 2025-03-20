enum layerType {
  PARTNER = "PARTNER",
  INTERNAL = "INTERNAL",
  TRAINING = "TRAINING",
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

export { layerType, factorInternalJobsForMap, factorTrainingsForMap }
