import { EligibleTrainingsForAppointment } from "../model/index.js"

export default () => ({
  /**
   * @description Creates new item.
   * @returns {Promise<*>}
   */
  create: async (body) => await EligibleTrainingsForAppointment.create(body),
  /**
   * @description Finds or creates a parameter.
   * @param {String} etablissement_siret
   * @param {String} etablissement_formateur_raison_sociale
   * @param {String} training_intitule_long
   * @param {String} training_code_formation_diplome
   * @param {String} lieu_formation_email
   * @param {String} gestionnaire_email
   * @param {String} etablissement_formateur_zip_code
   * @param {String} rco_formation_id
   * @param {String} referrers
   * @param {String} cle_ministere_educatif
   * @returns {Promise<EligibleTrainingsForAppointment>}
   */
  findUpdateOrCreate: async ({
    etablissement_siret,
    etablissement_formateur_raison_sociale,
    training_intitule_long,
    training_code_formation_diplome,
    lieu_formation_email,
    gestionnaire_email,
    etablissement_formateur_zip_code,
    rco_formation_id,
    referrers,
    cle_ministere_educatif,
  }) => {
    const parameter = {
      etablissement_siret,
      etablissement_formateur_raison_sociale,
      training_intitule_long,
      training_code_formation_diplome,
      lieu_formation_email,
      gestionnaire_email,
      etablissement_formateur_zip_code,
      rco_formation_id,
      referrers,
      cle_ministere_educatif,
    }

    const eligibleTrainingsForAppointmentFind = await EligibleTrainingsForAppointment.findOne({ rco_formation_id })

    if (eligibleTrainingsForAppointmentFind) {
      return EligibleTrainingsForAppointment.findOneAndUpdate({ _id: eligibleTrainingsForAppointmentFind._id }, parameter, { new: true })
    }

    const eligibleTrainingsForAppointment = new EligibleTrainingsForAppointment(parameter)
    await eligibleTrainingsForAppointment.save()

    return eligibleTrainingsForAppointment.toObject()
  },

  /**
   * @description Returns items.
   * @param {Object} conditions
   * @param {Object} options
   * @returns {Promise<EligibleTrainingsForAppointment[]>}
   */
  find: (conditions, options = {}) => EligibleTrainingsForAppointment.find(conditions, options),

  /**
   * @description Returns one item.
   * @param {Object} conditions
   * @returns {Promise<EligibleTrainingsForAppointment>}
   */
  findOne: (conditions) => EligibleTrainingsForAppointment.findOne(conditions),

  /**
   * @description Updates item.
   * @param {String} id
   * @param {EligibleTrainingsForAppointment} body
   * @returns {Promise<*>}
   */
  updateParameter: (id, body) => EligibleTrainingsForAppointment.findOneAndUpdate({ _id: id }, body, { new: true }),

  /**
   * @description Deletes an item.
   * @param {String} id
   * @returns {Promise<*>}
   */
  remove: (id) => EligibleTrainingsForAppointment.findByIdAndDelete(id),

  /**
   * @description Update many documents (or upsert).
   * @param {Object} conditions
   * @param {Object} values
   * @returns {Promise<EligibleTrainingsForAppointment>}
   */
  updateMany: (conditions, values) => EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true, upsert: true }),

  /**
   * @description Update many documents.
   * @param {Object} conditions
   * @param {Object} values
   * @returns {Promise<EligibleTrainingsForAppointment>}
   */
  update: (conditions, values) => EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true }),

  /**
   * @description Returns all formations that have
   * @param {String} etablissement_siret
   * @returns {Promise<EligibleTrainingsForAppointment>}
   */
  getParametersBySiret: ({ etablissement_siret }) => EligibleTrainingsForAppointment.find({ etablissement_siret }),

  /**
   * @description Returns item from its "id_rco_formation".
   * @param {String} idRcoFormation
   * @returns {Promise<EligibleTrainingsForAppointment>}
   */
  getParameterByIdRcoFormation: ({ rco_formation_id }) => EligibleTrainingsForAppointment.findOne({ rco_formation_id }),

  /**
   * @description Returns item from its "cle_ministere_educatif".
   * @param {String} cleMinistereEducatif
   * @returns {Promise<EligibleTrainingsForAppointment>}
   */
  getParameterByCleMinistereEducatif: ({ cleMinistereEducatif }) => EligibleTrainingsForAppointment.findOne({ cle_ministere_educatif: cleMinistereEducatif }),
})
