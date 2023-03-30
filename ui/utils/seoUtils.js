export const getSeoTitle = ({ parameterContext, page }) => {
  return `${page} en alternance ${getJobAndPlace({ parameters: parameterContext?.widgetParameters?.parameters })}| La bonne alternance`
}

const getJobAndPlace = ({ parameters }) => {
  return parameters?.jobName ? `- ${parameters.jobName}${parameters.address ? ` à ${parameters.address} ` : " sur la France entière "}` : ""
}

export const getSeoDescription = ({ parameterContext, page }) => {
  return `Recherche - ${page} en apprentissage ${getJobAndPlace({ parameters: parameterContext?.widgetParameters?.parameters })}sur le site de La bonne alternance`
}
