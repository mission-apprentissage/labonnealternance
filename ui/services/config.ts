import { campaignParameters } from "../utils/campaignParameters"
import { testingParameters } from "../utils/testingParameters"
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
  // @ts-expect-error: TODO
  if (p && !isNaN(p)) parameters.lat = parseFloat(p)

  p = getValueFromPath("lon")
  // @ts-expect-error: TODO
  if (p && !isNaN(p)) parameters.lon = parseFloat(p)

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
  // @ts-expect-error: TODO
  if (p && !isNaN(p) && (p === "10" || p === "30" || p === "60" || p === "100")) {
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

export const getItemParameters = () => {
  const itemParameters = { parameters: null, mode: null, applyItemParameters: false }

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

export const setUseMock = ({ parameterContext }) => {
  const useMock = getValueFromPath("useMock")
  if (useMock) {
    parameterContext.setUseMock(true)
    console.log("useMock : ", useMock)
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

export const initTestingParameters = () => {
  if (!testingParameters?.secret) {
    let p = getValueFromPath("secret")
    if (p) {
      testingParameters.secret = p

      p = getValueFromPath("simulatedRecipient")
      if (p) {
        testingParameters.simulatedRecipient = p
      }
    }
  }
}

/* à conserver
export const buildFormValuesFromParameterString = (urlParams) =>
{
  let params = {};
  params.lat = parseFloat(urlParams.get("lat"));
  params.lon = parseFloat(urlParams.get("lon"));
  params.jobName = urlParams.get("job_name");
  params.zipcode = urlParams.get("zipcode");
  params.insee = urlParams.get("insee");
  params.diploma = urlParams.get("diploma");
  params.address = urlParams.get("address");
  params.romes = urlParams.get("romes");
  params.radius = urlParams.get("radius");
  return buildFormValuesFromParameters(params);
}*/

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
      rncps: params.rncps ? params.rncps.split(",") : [],
      rncp: params.rncp || "",
    },
    ...location,
    radius: params.radius,
    diploma: params.diploma,
  }

  return formValues
}

export const initParametersFromQuery = ({ router, shouldPush, parameterContext }) => {
  let hasParameters = false

  const widgetParameters = getWidgetParameters()
  if (widgetParameters?.applyWidgetParameters) {
    if (widgetParameters.applyFormValues) {
      widgetParameters.formValues = buildFormValuesFromParameters(widgetParameters.parameters)
    }
    parameterContext.setWidgetParameters(widgetParameters)
  }

  getOpcoFilter({ parameterContext })
  setUseMock({ parameterContext })
  setDisplayMap({ parameterContext })
  setShowCombinedJob({ router, parameterContext })

  const itemParameters = getItemParameters()
  if (itemParameters && (itemParameters.applyItemParameters || itemParameters.mode)) {
    parameterContext.setItemParameters(itemParameters)
    hasParameters = true
  }

  initTestingParameters()

  if (hasParameters && shouldPush) {
    router.push("/recherche-apprentissage")
  }
}

export const initPostulerParametersFromQuery = () => {
  initTestingParameters()

  const caller = getValueFromPath("caller") // ex : diagoriente
  const itemId = getValueFromPath("itemId")
  const type = getValueFromPath("type") // matcha | lba | lbb

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
    type,
  }
}
