import { ZodOpenApiOperationObject, ZodOpenApiParameters, ZodOpenApiPathItemObject, ZodOpenApiPathsObject, ZodOpenApiResponsesObject, createDocument } from "zod-openapi"

import { zRoutes } from "../../index"
import { IRouteSchema } from "../../routes/common.routes"

function generateOpenApiResponsesObject(response: IRouteSchema["response"]): ZodOpenApiResponsesObject {
  return Object.keys(response).reduce((acc: ZodOpenApiResponsesObject, code: any) => {
    acc[code] = {
      content: { "application/json": { schema: response["200"] } },
    }

    return acc
  }, {})
}

function generateOpenApiParameters(route: IRouteSchema): ZodOpenApiParameters {
  const requestParams: ZodOpenApiParameters = {}

  if (route.params) {
    requestParams.path = route.params.shape
  }
  if (route.querystring) {
    requestParams.query = route.querystring.shape
  }

  return requestParams
}

function generateOpenApiOperationObject(route: IRouteSchema): ZodOpenApiOperationObject | null {
  if (!route.openapi) {
    return null
  }

  return {
    ...route.openapi,
    requestParams: generateOpenApiParameters(route),
    responses: generateOpenApiResponsesObject(route.response),
  }
}

function addOpenApiOperation(path: string, method: "get" | "put" | "post" | "delete", route: IRouteSchema, pathsObject: ZodOpenApiPathsObject): ZodOpenApiPathsObject {
  const op = generateOpenApiOperationObject(route)

  if (!op) {
    return pathsObject
  }

  const pathItem: ZodOpenApiPathItemObject = pathsObject[path] ?? {}
  pathItem[method] = op
  pathsObject[path] = pathItem

  return pathsObject
}

export function generateOpenApiSchema() {
  let pathObject: ZodOpenApiPathsObject = {}

  for (const [method, pathRoutes] of Object.entries(zRoutes)) {
    for (const [path, route] of Object.entries(pathRoutes)) {
      pathObject = addOpenApiOperation(path, method as "get" | "put" | "post" | "delete", route, pathObject)
    }
  }

  return createDocument({
    info: {
      title: "La bonne alternance",
      version: "0.0.0",
      description: "Trouvez ici les formations en alternance et les entreprises qui recrutent régulièrement en alternance",
      license: {
        name: "MIT",
      },
      contact: {
        name: "La bonne alternance",
        url: "https://labonnealternance.apprentissage.beta.gouv.fr",
      },
    },
    openapi: "3.1.0",
    paths: pathObject,
    servers: [
      {
        url: "https://labonnealternance.apprentissage.beta.gouv.fr",
        description: "Production",
      },
      {
        url: "https://labonnealternance-recette.apprentissage.beta.gouv.fr",
        description: "Recette",
      },
      {
        url: "https://labonnealternance-develop.apprentissage.beta.gouv.fr",
        description: "Developpement",
      },
      {
        url: "http://localhost",
        description: "Localhost",
      },
    ],
  })
}
