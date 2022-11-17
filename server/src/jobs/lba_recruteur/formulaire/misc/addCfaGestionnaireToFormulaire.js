import { Formulaire, UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { runScript } from "../../../scriptWrapper.js"

runScript(async () => {
  const data = await Formulaire.find({ origine: /cfa-/, gestionnaire: { $exists: false } })

  let stat = { total: data.length, error: 0, linked: 0 }

  await asyncForEach(data, async (form) => {
    let { origine } = form
    const cfa = await UserRecruteur.findOne({ scope: origine })

    if (!cfa) {
      stat.error++
    }

    form.gestionnaire = cfa.siret

    await form.save()
    stat.linked++
  })

  return stat
})
