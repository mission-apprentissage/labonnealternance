import { WidgetParameter } from "../model/index.js"

export default () => ({
  /**
   * @description Creates new item.
   * @param {String} etablissement_siret
   * @param {String} etablissement_raison_sociale
   * @param {String} formation_intitule
   * @param {String} formation_cfd
   * @param {String} email_rdv
   * @param {String} code_postal
   * @param {Number[]} referrers
   * @param {String} id_rco_formation
   * @param {String} catalogue_published
   * @param {Date} last_catalogue_sync
   * @param {String} id_parcoursup
   * @param {String} cle_ministere_educatif
   * @returns {Promise<*>}
   */
  createParameter: async ({
    etablissement_siret,
    etablissement_raison_sociale,
    formation_intitule,
    formation_cfd,
    email_rdv,
    code_postal,
    referrers,
    id_rco_formation,
    catalogue_published,
    last_catalogue_sync,
    id_parcoursup,
    cle_ministere_educatif,
  }) => {
    const widgetParameter = new WidgetParameter({
      etablissement_siret,
      etablissement_raison_sociale,
      formation_intitule,
      formation_cfd,
      email_rdv,
      referrers,
      code_postal,
      id_rco_formation,
      catalogue_published,
      last_catalogue_sync,
      id_parcoursup,
      cle_ministere_educatif,
    })

    await widgetParameter.save()

    return widgetParameter.toObject()
  },

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
    id_rco_formation,
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
      id_rco_formation,
      referrers,
      cle_ministere_educatif,
    }

    const widgetParameterFind = await WidgetParameter.findOne({ id_rco_formation })

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
   * @description Update many documents.
   * @param {Object} conditions
   * @param {Object} values
   * @returns {Promise<WidgetParameter>}
   */
  updateMany: (conditions, values) => WidgetParameter.updateMany(conditions, values, { new: true, upsert: true }),

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
  getParameterByIdRcoFormation: ({ idRcoFormation }) => WidgetParameter.findOne({ id_rco_formation: idRcoFormation }),

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
  getParameterByIdRcoFormationWithNotEmptyReferrers: ({ idRcoFormation }) => WidgetParameter.findOne({ id_rco_formation: idRcoFormation, referrers: { $not: { $size: 0 } } }),

  /**
   * @description Returns item through its "id_rco_formation".
   * @param {String} idRcoFormation
   * @param {Number} referrer
   * @returns {Promise<WidgetParameter>}
   */
  getParameterByIdRcoFormationReferrer: ({ idRcoFormation, referrer }) =>
    WidgetParameter.findOne({
      id_rco_formation: idRcoFormation,
      referrers: { $in: [referrer] },
    }),

  /**
   * @description Checks if widget is enabled or not.
   * @param {String} idRcoFormation
   * @param {Number} referrer
   * @returns {Promise<Boolean>}
   */
  isWidgetVisible: async ({ idRcoFormation, referrer }) => {
    const widgetParameter = await WidgetParameter.findOne({
      id_rco_formation: idRcoFormation,
      referrers: { $in: [referrer] },
    })

    return !!(widgetParameter && widgetParameter.email_rdv)
  },
})
