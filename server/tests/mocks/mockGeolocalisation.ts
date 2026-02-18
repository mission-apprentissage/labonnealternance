import nock from "nock"
import { generateFeaturePropertyFixture } from "shared/fixtures/geolocation.fixture"
import { parisFixture } from "shared/fixtures/referentiel/commune.fixture"

export const mockGeolocalisation = () => {
  return nock("https://data.geopf.fr:443/geocodage")
    .persist()
    .get(new RegExp("/search", "g"))
    .reply(200, {
      features: [
        {
          geometry: parisFixture.centre,
          properties: generateFeaturePropertyFixture({
            city: parisFixture.nom,
            postcode: parisFixture.codesPostaux[0],
            name: "20 AVENUE DE SEGUR",
          }),
        },
      ],
    })
}
