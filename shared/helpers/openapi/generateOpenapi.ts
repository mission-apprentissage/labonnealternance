import { OpenApiGeneratorV31, OpenAPIRegistry, ResponseConfig, RouteConfig } from "@asteasolutions/zod-to-openapi"

import { zRoutes } from "../../index"
import { IRouteSchema } from "../../routes/common.routes"

function generateOpenApiResponsesObject<R extends IRouteSchema["response"]>(response: R): { [statusCode: string]: ResponseConfig } {
  return Object.keys(response).reduce(
    (acc: { [statusCode: string]: ResponseConfig }, code: any) => {
      acc[code] = {
        description: response[code]._def.openapi?.metadata.description ?? response[code].description ?? "",
        content: {
          "application/json": {
            schema: response[code],
          },
        },
      }

      return acc
    },
    {} as { [statusCode: string]: ResponseConfig }
  )
}

function generateOpenApiRequest(route: IRouteSchema): RouteConfig["request"] {
  const requestParams: RouteConfig["request"] = {}

  if (route.body) {
    requestParams.body = {
      content: {
        "application/json": { schema: route.body },
      },
      required: true,
    }
  }
  if (route.params) {
    requestParams.params = route.params
  }
  if (route.querystring) {
    requestParams.query = route.querystring
  }
  if (route.headers) {
    requestParams.headers = route.headers
  }

  return requestParams
}

function addOpenApiOperation(path: string, method: "get" | "put" | "post" | "delete", route: IRouteSchema, registry: OpenAPIRegistry) {
  if (!route.openapi) {
    return
  }

  registry.registerPath({
    ...route.openapi,
    method,
    path,
    request: generateOpenApiRequest(route),
    responses: generateOpenApiResponsesObject(route.response),
  })
}

export function generateOpenApiSchema() {
  const registry = new OpenAPIRegistry()

  for (const [method, pathRoutes] of Object.entries(zRoutes)) {
    for (const [path, route] of Object.entries(pathRoutes)) {
      addOpenApiOperation(path, method as "get" | "put" | "post" | "delete", route, registry)
    }
  }

  const generator = new OpenApiGeneratorV31(registry.definitions)

  return generator.generateDocument({
    info: {
      title: "La bonne alternance",
      version: "V1.0",
      description: "Cherchez des formations et des emplois en alternance",
      license: {
        name: "MIT",
      },
      contact: {
        name: "La bonne alternance",
        url: "https://labonnealternance.apprentissage.beta.gouv.fr",
        email: "labonnealternance@apprentissage.beta.gouv.fr",
      },
    },
    openapi: "3.1.0",
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
        url: "https://labonnealternance-next.apprentissage.beta.gouv.fr",
        description: "Next",
      },
      {
        url: "http://localhost:5001",
        description: "Local",
      },
    ],
  })
}
