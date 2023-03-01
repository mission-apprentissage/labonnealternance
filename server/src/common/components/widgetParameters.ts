import { WidgetParameter } from "../model/index.js"

export default () => ({
  /**
   * @description Creates new item.
   * @param {Object}
   * @returns {Promise<*>}
   */
  createParameter: async (body) => await WidgetParameter.create(body),
  /**
   * @description Finds or creates a parameter.
   * @param {String} etablissement_siret
   * @param {String} etablissement_raison_sociale
   * @param {String} formation_intitule
   * @param {String} formation_cfd
   * @param {String} email_rdv
   * @param {String} email_decisionnaire
   * @param {String} code_postal
   * @param {String} id_rco_formation
   * @param {String} referrers
   * @param {String} cle_ministere_educatif
   * @returns {Promise<WidgetParameter>}
   */
  findUpdateOrCreate: async ({
    etablissement_siret,
    etablissement_raison_sociale,
    formation_intitule,
    formation_cfd,
    email_rdv,
    email_decisionnaire,
    code_postal,
    rco_formation_id,
    referrers,
    cle_ministere_educatif,
  }) => {
    const parameter = {
      etablissement_siret,
      etablissement_raison_sociale,
      formation_intitule,
      formation_cfd,
      email_rdv,
      email_decisionnaire,
      code_postal,
      rco_formation_id,
      referrers,
      cle_ministere_educatif,
    }

    const widgetParameterFind = await WidgetParameter.findOne({ rco_formation_id })

    if (widgetParameterFind) {
      return WidgetParameter.findOneAndUpdate({ _id: widgetParameterFind._id }, parameter, { new: true })
    }

    const widgetParameter = new WidgetParameter(parameter)
    await widgetParameter.save()

    return widgetParameter.toObject()
  },

  /**
   * @description Returns items.
   * @param {Object} conditions
   * @param {Object} options
   * @returns {Promise<WidgetParameter[]>}
   */
  find: (conditions, options = {}) => WidgetParameter.find(conditions, options),

  /**
   * @description Returns one item.
   * @param {Object} conditions
   * @returns {Promise<WidgetParameter>}
   */
  findOne: (conditions) => WidgetParameter.findOne(conditions),

  /**
   * @description Updates item.
   * @param {String} id
   * @param {WidgetParameter} body
   * @returns {Promise<*>}
   */
  updateParameter: (id, body) => WidgetParameter.findOneAndUpdate({ _id: id }, body, { new: true }),

  /**
   * @description Deletes an item.
   * @param {String} id
   * @returns {Promise<*>}
   */
  deleteParameter: (id) => WidgetParameter.findByIdAndDelete(id),

  /**
   * @description Update many documents (or upsert).
   * @param {Object} conditions
   * @param {Object} values
   * @returns {Promise<WidgetParameter>}
   */
  updateMany: (conditions, values) => WidgetParameter.updateMany(conditions, values, { new: true, upsert: true }),

  /**
   * @description Update many documents.
   * @param {Object} conditions
   * @param {Object} values
   * @returns {Promise<WidgetParameter>}
   */
  update: (conditions, values) => WidgetParameter.updateMany(conditions, values, { new: true }),

  /**
   * @description Returns all formations that have
   * @param {String} etablissement_siret
   * @returns {Promise<WidgetParameter>}
   */
  getParametersBySiret: ({ etablissement_siret }) => WidgetParameter.find({ etablissement_siret }),

  /**
   * @description Returns item from its "id_rco_formation".
   * @param {String} idRcoFormation
   * @returns {Promise<WidgetParameter>}
   */
  getParameterByIdRcoFormation: ({ rco_formation_id }) => WidgetParameter.findOne({ rco_formation_id }),

  /**
   * @description Returns item from its "cle_ministere_educatif".
   * @param {String} cleMinistereEducatif
   * @returns {Promise<WidgetParameter>}
   */
  getParameterByCleMinistereEducatif: ({ cleMinistereEducatif }) => WidgetParameter.findOne({ cle_ministere_educatif: cleMinistereEducatif }),

  /**
   * @description Returns items from its "id_rco_formation" have referrer item.
   * @param {String} idRcoFormation
   * @returns {Promise<WidgetParameter>}
   */
  getParameterByIdRcoFormationWithNotEmptyReferrers: ({ idRcoFormation }) => WidgetParameter.findOne({ rco_formation_id: idRcoFormation, referrers: { $not: { $size: 0 } } }),

  /**
   * @description Checks if widget is enabled or not.
   * @param {String} idRcoFormation
   * @param {Number} referrer
   * @returns {Promise<Boolean>}
   */
  isWidgetVisible: async ({ idRcoFormation, referrer }) => {
    const widgetParameter = await WidgetParameter.findOne({
      rco_formation_id: idRcoFormation,
      referrers: { $in: [referrer] },
    })

    return !!(widgetParameter && widgetParameter.email_rdv)
  },
})
