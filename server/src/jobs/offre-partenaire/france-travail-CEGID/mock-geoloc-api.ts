import nock from "nock"
import { generateFeaturePropertyFixture } from "shared/fixtures/geolocation.fixture"
import { parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { API_ADRESSE_URL } from "@/services/geolocation.service"

export const mockGeolocApi = () => {
  return nock(API_ADRESSE_URL)
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
