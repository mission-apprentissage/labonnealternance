import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { CollectionName } from "shared/models/models"
import rawAtlasModel from "shared/models/rawAtlas.model"
import rawMeteojobModel from "shared/models/rawMeteojob.model"
import rawNosTalentsNosEmploisModel from "shared/models/rawNosTalentsNosEmplois.model"
import rawToulouseMetropoleModel from "shared/models/rawToulouseMetropole.model"
import rawViteUnEmploiModel from "shared/models/rawViteUnEmploi.model"

import config from "@/config"
import { importCleverConnectRaw, importCleverConnectToComputed } from "@/jobs/offrePartenaire/clever-connect/importCleverConnect"

const cleverConnectProcessor = async (model: { collectionName: CollectionName }, label: JOBPARTNERS_LABEL, url: string) => {
  await importCleverConnectRaw(model.collectionName, label, url)
  await importCleverConnectToComputed(model.collectionName, label)
}

export const processAtlas = () => cleverConnectProcessor(rawAtlasModel, JOBPARTNERS_LABEL.ATLAS, config.cleverConnect.atlasUrl)
export const processMeteojob = () => cleverConnectProcessor(rawMeteojobModel, JOBPARTNERS_LABEL.METEOJOB, config.cleverConnect.meteojobUrl)
export const processViteUnEmploi = () => cleverConnectProcessor(rawViteUnEmploiModel, JOBPARTNERS_LABEL.VITE_UN_EMPLOI, config.cleverConnect.viteUnEmploi)
export const processToulouseMetropole = () => cleverConnectProcessor(rawToulouseMetropoleModel, JOBPARTNERS_LABEL.TOULOUSE_METROPOLE, config.cleverConnect.toulouseMetropole)
export const processNosTalentsNosEmplois = () =>
  cleverConnectProcessor(rawNosTalentsNosEmploisModel, JOBPARTNERS_LABEL.NOS_TALENTS_NOS_EMPLOIS, config.cleverConnect.nosTaletsNosEmplois)
