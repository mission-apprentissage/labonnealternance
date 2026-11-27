import type { IResponse, IRoutes } from "shared"

export type ISeoSecteurJson = NonNullable<IResponse<IRoutes["get"]["/_private/seo/secteur/:secteur"]>>
