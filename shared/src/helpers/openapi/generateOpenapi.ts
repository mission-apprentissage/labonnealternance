import { OpenApiGeneratorV31, OpenAPIRegistry, ResponseConfig, RouteConfig } from "@asteasolutions/zod-to-openapi"
import { formatParamUrl } from "@fastify/swagger"
import type { SecurityRequirementObject } from "openapi3-ts/oas30"
import { ZodEffects } from "zod"

import { IRouteSchema } from "../../routes/common.routes.js"
import { zRoutes } from "../../routes/index.js"

function generateOpenApiResponsesObject<R extends IRouteSchema["response"]>(response: R): { [statusCode: string]: ResponseConfig } {
  return Object.keys(response).reduce(
    (acc: { [statusCode: string]: ResponseConfig }, code: any) => {
      acc[code] = {
        description: response[code]._def.openapi?.metadata?.description ?? response[code].description ?? "",
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

  if (route.method !== "get" && route.body) {
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
    requestParams.query = route.querystring instanceof ZodEffects ? route.querystring.innerType() : route.querystring
  }
  if (route.headers) {
    requestParams.headers = route.headers
  }

  return requestParams
}

const authorizedSchemes = ["api-key", "api-apprentissage"]
function getSecurityRequirementObject(route: IRouteSchema): SecurityRequirementObject[] {
  if (route.securityScheme === null) {
    return []
  }

  if (!authorizedSchemes.includes(route.securityScheme.auth)) {
    throw new Error("getSecurityRequirementObject: securityScheme not supported")
  }

  return [{ [route.securityScheme.auth]: [] }]
}

function addOpenApiOperation(path: string, method: "get" | "put" | "post" | "delete", route: IRouteSchema, registry: OpenAPIRegistry) {
  if (!route.openapi) {
    return
  }

  registry.registerPath({
    ...route.openapi,
    method,
    path: formatParamUrl(path),
    request: generateOpenApiRequest(route),
    responses: generateOpenApiResponsesObject(route.response),
    security: getSecurityRequirementObject(route),
  })
}

export function generateOpenApiSchema(version: string, env: string, publicUrl: string) {
  const registry = new OpenAPIRegistry()

  registry.registerComponent("securitySchemes", "api-key", {
    type: "apiKey",
    name: "authorization",
    in: "header",
  })

  for (const [method, pathRoutes] of Object.entries(zRoutes)) {
    for (const [path, route] of Object.entries(pathRoutes)) {
      addOpenApiOperation(path, method as "get" | "put" | "post" | "delete", route as IRouteSchema, registry)
    }
  }

  const generator = new OpenApiGeneratorV31(registry.definitions)

  return generator.generateDocument({
    info: {
      title: "La bonne alternance",
      version,
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
        url: publicUrl,
        description: env,
      },
      {
        url: `${publicUrl}/v2`,
        description: `${env} V2`,
      },
    ],
  })
}
