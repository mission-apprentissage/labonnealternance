import { getValueFromPath } from "../utils/tools"
import { campaignParameters } from "../utils/campaignParameters"
import { testingParameters } from "../utils/testingParameters"

export const getWidgetParameters = () => {
  let widgetParameters = { parameters: null, applyWidgetParameters: false }

  let parameters = {}
  let applyWidgetParameters = true

  parameters = {}

  let p = getValueFromPath("lat")
  if (p && !isNaN(p)) parameters.lat = parseFloat(p)

  p = getValueFromPath("lon")
  if (p && !isNaN(p)) parameters.lon = parseFloat(p)

  p = getValueFromPath("romes") // todo appliquer un ctrl regexp sur romes, max 3
  if (p) parameters.romes = p
  else applyWidgetParameters = false

  p = getValueFromPath("radius") //todo: vérifier les valeurs légitimes
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

  //console.log("widgetParameters : ", widgetParameters);

  return widgetParameters
}

export const getItemParameters = () => {
  let itemParameters = { parameters: null, mode: null, applyItemParameters: false }

  if (getValueFromPath("itemId")) {
    let parameters = {}
    let applyItemParameters = true

    parameters = {
      itemId: getValueFromPath("itemId"),
    }

    let p = getValueFromPath("type")
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
  let opcoFilter = getValueFromPath("opco")
  if (opcoFilter) {
    parameterContext.setOpcoFilter(opcoFilter)
  }
}

export const setUseMock = ({ parameterContext }) => {
  let useMock = getValueFromPath("useMock")
  if (useMock) {
    parameterContext.setUseMock(true)
    console.log("useMock : ", useMock)
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
  let location = params.lon
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

  let formValues = {
    job: {
      label: params.jobName,
      romes: params.romes.split(","),
      rncps: params.rncps ? params.rncps.split(",") : [],
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
  const type = getValueFromPath("type") // matcha | lba | lbb

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
