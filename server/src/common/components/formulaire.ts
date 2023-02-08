import moment from "moment"
import { ANNULEE, POURVUE } from "../constants.js"
import { Formulaire } from "../model/index.js"

export default () => ({
  getFormulaires: async (query, options, { page, limit }) => {
    const response = await Formulaire.paginate(query, { ...options, page, limit, lean: true })
    return {
      pagination: {
        page: response.page,
        result_per_page: limit,
        number_of_page: response.pages,
        total: response.total,
      },
      data: response.docs,
    }
  },
  getFormulaire: (query) => Formulaire.findOne(query).lean(),
  createFormulaire: (payload) => Formulaire.create(payload),
  deleteFormulaire: (formId) => Formulaire.findByIdAndDelete(formId),
  deleteFormulaireFromGestionnaire: (siret) => Formulaire.deleteMany({ gestionnaire: siret }),
  updateFormulaire: (id_form, payload) => Formulaire.findOneAndUpdate({ id_form }, payload, { new: true }),
  archiveFormulaire: async (id_form) => {
    let form = await Formulaire.findOne({ id_form })

    form.offres.map((offre) => {
      offre.statut = "Annulée"
    })

    form.statut = "Archivé"
    await form.save()

    return true
  },
  getOffre: (id) => Formulaire.findOne({ "offres._id": id }).lean(),
  createOffre: (id_form, payload) => Formulaire.findOneAndUpdate({ id_form }, { $push: { offres: payload } }, { new: true }),
  updateOffre: (id_offre, payload) =>
    Formulaire.findOneAndUpdate(
      { "offres._id": id_offre },
      {
        $set: {
          "offres.$": payload,
        },
      },
      { new: true }
    ),
  provideOffre: async (id_offre) => {
    await Formulaire.findOneAndUpdate(
      { "offres._id": id_offre },
      {
        $set: {
          "offres.$.statut": POURVUE,
        },
      }
    )
    return true
  },
  cancelOffre: async (id_offre) => {
    await Formulaire.findOneAndUpdate(
      { "offres._id": id_offre },
      {
        $set: {
          "offres.$.statut": ANNULEE,
        },
      }
    )
    return true
  },
  extendOffre: async (id_offre) => {
    await Formulaire.findOneAndUpdate(
      { "offres._id": id_offre },
      {
        $set: {
          "offres.$.date_expiration": moment().add(1, "months").format("YYYY-MM-DD"),
          "offres.$.date_derniere_prolongation": Date.now(),
        },
        $inc: { "offres.$.nombre_prolongation": 1 },
      }
    )
    return true
  },
})
