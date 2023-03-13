import { Opco } from "../common/model/index.js"

export const saveOpco = async (opcoData) => {
  const opco = new Opco(opcoData)

  if ((await Opco.countDocuments({ siren: opcoData.siren })) === 0) {
    try {
      await opco.save()
      return "ok"
    } catch (err) {
      //do nothing probably duplicate
      return "error"
    }
  }
}
