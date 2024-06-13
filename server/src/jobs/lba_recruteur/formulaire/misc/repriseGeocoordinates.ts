import { getDbCollection } from "@/common/utils/mongodbUtils"

import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { getGeoCoordinates } from "../../../../services/etablissement.service"

export const repiseGeocoordinates = async () => {
  const forms = await getDbCollection("recruiters").find({ geo_coordinates: "NOT FOUND" }).toArray()

  await asyncForEach(forms, async (form: any) => {
    const numeroEtRue = form.address_detail.acheminement_postal.l4
    const codePostalEtVille = form.address_detail.acheminement_postal.l6
    const { latitude, longitude } = await getGeoCoordinates(`${numeroEtRue}, ${codePostalEtVille}`).catch(() => getGeoCoordinates(codePostalEtVille))
    form.geo_coordinates = `${latitude},${longitude}`
    form.save()
  })
}
