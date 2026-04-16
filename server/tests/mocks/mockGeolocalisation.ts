import nock from "nock"
import type { IAPIAdresse } from "shared"
import { generateFeaturePropertyFixture } from "shared/fixtures/geolocation.fixture"
import { parisFixture } from "shared/fixtures/referentiel/commune.fixture"

export const mockGeolocalisation = () => {
  const apiResponse: IAPIAdresse = {
    version: "1",
    attribution: "",
    licence: "",
    query: "",
    limit: 1,
    type: "Response",
    features: [
      {
        type: "Feature",
        geometry: parisFixture.centre,
        properties: generateFeaturePropertyFixture({
          city: parisFixture.nom,
          postcode: parisFixture.codesPostaux[0],
          name: "20 AVENUE DE SEGUR",
        }),
      },
    ],
  }

  return nock("https://data.geopf.fr:443/geocodage").persist().get(new RegExp("/search", "g")).reply(200, apiResponse)
}
