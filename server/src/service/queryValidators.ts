const validateRomes = (romes, error_messages, romeLimit = 15) => {
  // codes ROME : romes
  if (!romes) error_messages.push("romes : Rome codes are missing. At least 1.")
  else if (romes.split(",").length > romeLimit) error_messages.push(`romes : Too many rome codes. Maximum is ${romeLimit}.`)
  if (!/^[a-zA-Z][0-9]{4}(,[a-zA-Z][0-9]{4})*$/.test(romes))
    error_messages.push("romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234")
}

const validateRomeOrDomain = ({ romes, romeDomain, romeLimit = 15, optional }, error_messages) => {
  // codes ROME : romes
  if (!optional && !romes && !romeDomain) {
    error_messages.push("romes, romeDomain : You must define at least 1 rome code OR a single romeDomain.")
  } else if (romes && romeDomain) {
    error_messages.push("romes, romeDomain : You must define either romes OR romeDomain, not both.")
  } else if (romes) {
    if (romes.split(",").length > romeLimit) error_messages.push(`romes : Too many rome codes. Maximum is ${romeLimit}.`)
    if (!/^[a-zA-Z][0-9]{4}(,[a-zA-Z][0-9]{4})*$/.test(romes))
      error_messages.push("romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234")
  } else if (romeDomain) {
    if (!/^[a-zA-Z][0-9]{2}$/.test(romeDomain) && !/^[a-zA-Z]$/.test(romeDomain))
      error_messages.push("romeDomain : Badly formatted romeDomain. Rome domain must be one letter or one letter followed by 2 digit number. ex : A or A12")
  }
}

const validateOptionalRomeOrDomain = ({ romes, romeDomain, romeLimit = 15 }, error_messages) => {
  validateRomeOrDomain({ romes, romeDomain, romeLimit, optional: true }, error_messages)
}

import { regionCodeToDepartmentList } from "../common/utils/regionInseeCodes.js"

const validateOptionalRegion = ({ region, departement }, error_messages) => {
  // codes ROME : romes
  if (region && departement) {
    error_messages.push("region, departement : You must define either region OR departement, not both.")
  } else if (departement) {
    if (!/^[0-9]{2,3}$/.test(departement))
      error_messages.push("departement : Badly formatted departement. departement must be a two digit number or three digit number for overseas departments. ex : 01 or 974")
  } else if (region) {
    if (!/^[0-9]{2}$/.test(region)) error_messages.push("region : Badly formatted region. region must be a two digit number. ex : 01")

    if (Object.keys(regionCodeToDepartmentList).indexOf(region) < 0)
      error_messages.push("region : Badly formatted region. region must be one of the allowed values as described in the api online doc.")
  }
}

const validateRegionOrRome = ({ region, departement, romes, romeDomain }, error_messages) => {
  if (!(region || departement) && !(romes || romeDomain)) {
    error_messages.push("region, departement, romes, romeDomain : You must assign a value to at least one of these parameters.")
  }
}

const validateRadius = (radius, error_messages, min = 0, max = 200) => {
  // rayon de recherche : radius
  if (radius === undefined || radius === "") error_messages.push("radius : Search radius is missing.")
  else if (isNaN(radius)) error_messages.push("radius : Search radius must be a number.")
  else if (parseInt(radius) < min || (parseInt(radius) > max && parseInt(radius) !== 20000))
    error_messages.push(`radius : Search radius must be a number between ${min} and ${max}.`)
}

const validateLatitude = (latitude, error_messages) => {
  // coordonnées gps : latitude
  if (latitude === undefined || latitude === "") error_messages.push("latitude : Search center latitude is missing.")
  else if (isNaN(latitude)) error_messages.push("latitude : Search center latitude must be a number.")
  else if (parseFloat(latitude) > 90 || parseFloat(latitude) < -90) error_messages.push("latitude : Search center latitude must be a number between -90 and 90.")
}

const validateLongitude = (longitude, error_messages) => {
  if (longitude === undefined || longitude === "") error_messages.push("longitude : Search center longitude is missing.")
  else if (isNaN(longitude)) error_messages.push("longitude : Search center longitude must be a number.")
  else if (parseFloat(longitude) > 180 || parseFloat(longitude) < -180) error_messages.push("longitude : Search center longitude must be a number between -180 and 180.")
}

const validateDiploma = (diploma, error_messages) => {
  // diploma mal formé si présent
  if (diploma && ["3", "4", "5", "6", "7"].indexOf(diploma[0]) < 0)
    error_messages.push('diploma : Optional diploma argument used with wrong value. Should contains only one of "3xxx","4xxx","5xxx","6xxx","7xxx". xxx maybe any value')
}

const validateInsee = (insee, error_messages) => {
  // code INSEE : insee
  if (!insee) error_messages.push("insee : insee city code is missing.")
  if (!/^[0-9][abAB0-9][0-9]{3}$/.test(insee)) error_messages.push("insee : Badly formatted insee city code. Must be 5 digit number.")
}

const validateApiSources = (apiSources, error_messages, allowedSources = ["formations", "lbb", "lba", "offres", "matcha"]) => {
  // source mal formée si présente
  if (apiSources) {
    let sources = apiSources.split(",")
    let areSourceOk = true
    sources.forEach((source) => {
      if (allowedSources.indexOf(source) < 0) areSourceOk = false
    })
    if (!areSourceOk)
      error_messages.push(`sources : Optional sources argument used with wrong value. Should contains comma separated values among '${allowedSources.join("', '")}'.`)
  }
}

import { isOriginLocal } from "../common/utils/isOriginLocal.js"

// contrôle sur la présence d'un appelant valide
const validateCaller = ({ caller, referer }, error_messages = []) => {
  if (!isOriginLocal(referer) && !caller) {
    error_messages.push("caller : caller is missing.")
    return false
  } else return true
}

export {
  validateRadius,
  validateRomes,
  validateRomeOrDomain,
  validateLatitude,
  validateLongitude,
  validateApiSources,
  validateDiploma,
  validateInsee,
  validateOptionalRomeOrDomain,
  validateOptionalRegion,
  validateRegionOrRome,
  validateCaller,
}
