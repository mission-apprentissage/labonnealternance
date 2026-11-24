import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { CollectionName } from "shared/models/models"
import rawAtlasModel from "shared/models/raw-atlas.model"
import rawMeteojobModel from "shared/models/raw-meteojob.model"
import rawNosTalentsNosEmploisModel from "shared/models/raw-nos-talents-nos-emplois.model"
import rawToulouseMetropoleModel from "shared/models/raw-toulouse-metropole.model"
import rawViteUnEmploiModel from "shared/models/raw-vite-un-emploi.model"
import config from "@/config"
import { httpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importCleverConnectRaw, importCleverConnectToComputed } from "./import-clever-connect"

const cleverConnectProcessor = async (model: { collectionName: CollectionName }, label: JOBPARTNERS_LABEL, url: string, { skipIfUnchanged = false }: FluxImportOptions) =>
  importFluxIfChanged({
    fluxes: [{ partnerLabel: label, rawCollection: model.collectionName, source: httpFluxSource(url) }],
    skipIfUnchanged,
    process: async ([stream]) => {
      const raw = await importCleverConnectRaw(model.collectionName, label, stream)
      const computed = await importCleverConnectToComputed(model.collectionName, label)
      return { raw, computed }
    },
  })

export const processAtlas = async (options: FluxImportOptions = {}) => cleverConnectProcessor(rawAtlasModel, JOBPARTNERS_LABEL.ATLAS, config.cleverConnect.atlasUrl, options)
export const processMeteojob = async (options: FluxImportOptions = {}) =>
  cleverConnectProcessor(rawMeteojobModel, JOBPARTNERS_LABEL.METEOJOB, config.cleverConnect.meteojobUrl, options)
export const processViteUnEmploi = async (options: FluxImportOptions = {}) =>
  cleverConnectProcessor(rawViteUnEmploiModel, JOBPARTNERS_LABEL.VITE_UN_EMPLOI, config.cleverConnect.viteUnEmploi, options)
export const processToulouseMetropole = async (options: FluxImportOptions = {}) =>
  cleverConnectProcessor(rawToulouseMetropoleModel, JOBPARTNERS_LABEL.TOULOUSE_METROPOLE, config.cleverConnect.toulouseMetropole, options)
export const processNosTalentsNosEmplois = async (options: FluxImportOptions = {}) =>
  cleverConnectProcessor(rawNosTalentsNosEmploisModel, JOBPARTNERS_LABEL.NOS_TALENTS_NOS_EMPLOIS, config.cleverConnect.nosTaletsNosEmplois, options)
