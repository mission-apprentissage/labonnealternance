import { UrlObject } from "url"

import { IStaticMetiers, IStaticVilles } from "./getStaticData"

export const buildLinkForTownAndJob = (town: Partial<IStaticVilles>, job: IStaticMetiers): UrlObject => {
  const pathname = "/recherche"
  const query: Record<string, string | boolean | string[]> = {
    display: "list",
    displayMap: false,
    job_name: encodeURIComponent(job.name),
    romes: job.romes.join(","),
  }

  if (town.name !== "France") {
    Object.assign(query, {
      radius: "30",
      lat: town.lat.toString(),
      lon: town.lon.toString(),
      zipcode: town.zip,
      insee: town.insee,
      address: encodeURIComponent(town.name),
    })
  }

  return {
    pathname,
    query,
  }
}
