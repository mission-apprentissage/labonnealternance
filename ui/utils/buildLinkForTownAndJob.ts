import { UrlObject } from "url"

interface Town {
  name: string
  lat?: number
  lon?: number
  zip?: string
  insee?: string
}

interface Job {
  name: string
  romes: string[]
}

export const buildLinkForTownAndJob = (town: Town, job: Job): UrlObject => {
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
