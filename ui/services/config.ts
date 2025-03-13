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

export type IWidgetParameters = {
  parameters: IConfigParameters
  applyWidgetParameters: boolean
  applyFormValues: boolean | undefined
  formValues: undefined | any
}

export const getWidgetParameters = () => {
  const widgetParameters: IWidgetParameters = { parameters: {}, applyWidgetParameters: true, applyFormValues: undefined, formValues: undefined }

  let p = getValueFromPath("lat")
  if (p && !Number.isNaN(p)) widgetParameters.parameters.lat = parseFloat(p)

  p = getValueFromPath("lon")
  if (p && !Number.isNaN(p)) widgetParameters.parameters.lon = parseFloat(p)

  p = getValueFromPath("rncp")
  if (p) {
    widgetParameters.parameters.rncp = p
  }

  p = getValueFromPath("romes")
  if (p) {
    widgetParameters.parameters.romes = p
  }

  if (!widgetParameters.parameters.romes && !widgetParameters.parameters.rncp) {
    widgetParameters.applyWidgetParameters = false
  }

  p = getValueFromPath("radius")
  if (p && !Number.isNaN(p) && (p === "10" || p === "30" || p === "60" || p === "100")) {
    widgetParameters.parameters.radius = parseInt(p)
  }

  widgetParameters.parameters.returnURI = getValueFromPath("return_uri")
  widgetParameters.parameters.returnLogoURL = getValueFromPath("return_logo_url")
  widgetParameters.parameters.jobName = getValueFromPath("job_name")
  widgetParameters.parameters.frozenJob = getValueFromPath("frozen_job")
  widgetParameters.parameters.caller = getValueFromPath("caller")
  widgetParameters.parameters.zipcode = getValueFromPath("zipcode")
  widgetParameters.parameters.insee = getValueFromPath("insee")
  widgetParameters.parameters.diploma = getValueFromPath("diploma")
  widgetParameters.parameters.address = getValueFromPath("address")

  p = getValueFromPath("utm_campaign")
  if (p) {
    campaignParameters.utm_campaign = p
    campaignParameters.utm_source = getValueFromPath("utm_source")
    campaignParameters.utm_medium = getValueFromPath("utm_medium")
  }

  if (widgetParameters.applyWidgetParameters && widgetParameters.parameters.jobName) {
    widgetParameters.applyFormValues = true
  }

  return widgetParameters
}

export const getItemParameters = () => {
  const itemParameters: {
    parameters: {
      itemId?: string
      type?: string
    } | null
    mode: string | null
    applyItemParameters: boolean
  } = { parameters: null, mode: null, applyItemParameters: false }

  if (getValueFromPath("itemId")) {
    let parameters: {
      itemId?: string
      type?: string
    } = {}
    let applyItemParameters = true

    parameters = {
      itemId: getValueFromPath("itemId"),
      type: undefined,
    }

    const p = getValueFromPath("type")
    if (p) parameters.type = p
    else applyItemParameters = false

    itemParameters.parameters = parameters
    itemParameters.applyItemParameters = applyItemParameters
  }

  if (getValueFromPath("mode")) {
    itemParameters.mode = "debug"
  }

  return itemParameters
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

// TODO: checker la pertinence pour nettoyage
export const setShowCombinedJob = ({ router, parameterContext }) => {
  const showCombinedJob = getValueFromPath("showCombinedJob")
  if (showCombinedJob !== null) {
    parameterContext.setShowCombinedJob(showCombinedJob === "false" ? false : true)
  } else if (router.pathname === "/recherche-emploi") {
    parameterContext.setShowCombinedJob(false)
  }
}

export const buildFormValuesFromParameters = (params) => {
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

  const itemParameters = getItemParameters()
  if (itemParameters && (itemParameters.applyItemParameters || itemParameters.mode)) {
    parameterContext.setItemParameters(itemParameters)
  }
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
