import { assertUnreachable } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { campaignParameters } from "../utils/campaignParameters"
import { getValueFromPath } from "../utils/tools"

type IConfigParameters = {
  lat?: number
  lon?: number
  romes?: string
  rncp?: string
  radius?: number
  returnURI?: string
  returnLogoURL?: string
  jobName?: string
  frozenJob?: string
  caller?: string
  zipcode?: string
  insee?: string
  diploma?: string
  address?: string
}

export const getWidgetParameters = () => {
  const widgetParameters = { parameters: null, applyWidgetParameters: false, applyFormValues: undefined, formValues: undefined }

  let parameters: IConfigParameters = {}
  let applyWidgetParameters = true

  parameters = {}

  let p = getValueFromPath("lat")
  if (p && !Number.isNaN(p)) parameters.lat = parseFloat(p)

  p = getValueFromPath("lon")
  if (p && !Number.isNaN(p)) parameters.lon = parseFloat(p)

  p = getValueFromPath("rncp")
  if (p) {
    parameters.rncp = p
  }

  p = getValueFromPath("romes")
  if (p) {
    parameters.romes = p
  }

  if (!parameters.romes && !parameters.rncp) {
    applyWidgetParameters = false
  }

  p = getValueFromPath("radius")
  if (p && !Number.isNaN(p) && (p === "10" || p === "30" || p === "60" || p === "100")) {
    parameters.radius = parseInt(p)
  }

  parameters.returnURI = getValueFromPath("return_uri")
  parameters.returnLogoURL = getValueFromPath("return_logo_url")
  parameters.jobName = getValueFromPath("job_name")
  parameters.frozenJob = getValueFromPath("frozen_job")
  parameters.caller = getValueFromPath("caller")
  parameters.zipcode = getValueFromPath("zipcode")
  parameters.insee = getValueFromPath("insee")
  parameters.diploma = getValueFromPath("diploma")
  parameters.address = getValueFromPath("address")

  p = getValueFromPath("utm_campaign")
  if (p) {
    campaignParameters.utm_campaign = p
    campaignParameters.utm_source = getValueFromPath("utm_source")
    campaignParameters.utm_medium = getValueFromPath("utm_medium")
  }

  widgetParameters.parameters = parameters
  widgetParameters.applyWidgetParameters = applyWidgetParameters

  if (applyWidgetParameters && parameters.jobName) {
    widgetParameters.applyFormValues = true
  }

  return widgetParameters
}

export const getOpcoFilter = ({ parameterContext }) => {
  const opcoFilter = getValueFromPath("opco")
  const opcoUrlFilter = getValueFromPath("opcoUrl")
  if (opcoFilter || opcoUrlFilter) {
    parameterContext.setOpcoFilter(opcoFilter, opcoUrlFilter)
  }
}

export const setDisplayMap = ({ parameterContext }) => {
  const displayMap = getValueFromPath("displayMap")
  if (displayMap !== null) {
    parameterContext.setDisplayMap(displayMap === "true" ? true : false)
  }
}

export const setShowCombinedJob = ({ router, parameterContext }) => {
  const showCombinedJob = getValueFromPath("showCombinedJob")
  if (showCombinedJob !== null) {
    parameterContext.setShowCombinedJob(showCombinedJob === "false" ? false : true)
  } else if (router.pathname === "/recherche-emploi") {
    parameterContext.setShowCombinedJob(false)
  }
}

const buildFormValuesFromParameters = (params) => {
  const location = params.lon
    ? {
        location: {
          value: {
            coordinates: [params.lon, params.lat],
            type: "Point",
          },
          insee: params.insee,
          zipcode: params.zipcode,
          label: params.address,
        },
      }
    : { location: null }

  const formValues = {
    job: {
      label: params.jobName,
      romes: params.romes.split(","),
    },
    ...location,
    radius: params.radius,
    diploma: params.diploma,
  }

  return formValues
}

export const initParametersFromQuery = ({ router, parameterContext }) => {
  const widgetParameters = getWidgetParameters()
  if (widgetParameters?.applyWidgetParameters) {
    if (widgetParameters.applyFormValues) {
      widgetParameters.formValues = buildFormValuesFromParameters(widgetParameters.parameters)
    }
    parameterContext.setWidgetParameters(widgetParameters)
  }

  getOpcoFilter({ parameterContext })
  setDisplayMap({ parameterContext })
  setShowCombinedJob({ router, parameterContext })
}

type QueryParameterType = "matcha" | "lbb" | "lba"
/**
 *
 * KBA 6/03/2024 : to remove once migration as been made to API V2 through API apprentissage
 */
const convertTypeForMigration = (type: QueryParameterType) => {
  switch (type) {
    case "matcha":
      return LBA_ITEM_TYPE_OLD.MATCHA

    case "lba":
    case "lbb":
      return LBA_ITEM_TYPE_OLD.LBA

    default:
      assertUnreachable(type)
      break
  }
}

export const initPostulerParametersFromQuery = () => {
  const caller = getValueFromPath("caller") // ex : diagoriente
  const itemId = getValueFromPath("itemId")
  const type = getValueFromPath("type") as QueryParameterType

  if (!caller) {
    throw new Error("missing_caller_parameter")
  }
  if (!itemId) {
    throw new Error("missing_item_id_parameter")
  }
  if (!type) {
    throw new Error("missing_type_parameter")
  }

  return {
    caller,
    itemId,
    type: convertTypeForMigration(type),
  }
}
