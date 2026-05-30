import nock from "nock"
import { apiEntrepriseEtablissementFixture } from "@/common/apis/apiEntreprise/apiEntreprise.client.fixture"

export const mockApiEntreprise = {
  infosEntreprise() {
    return nock("https://entreprise.api.gouv.fr/v3/insee").persist().get(new RegExp("/sirene/etablissements/diffusibles/", "g")).reply(200, apiEntrepriseEtablissementFixture.dinum)
  },
}
