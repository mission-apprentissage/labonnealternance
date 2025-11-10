import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { CollectionName } from "shared/models/models"
import rawAtlasModel from "shared/models/rawAtlas.model"
import rawMeteojobModel from "shared/models/rawMeteojob.model"
import rawNosTalentsNosEmploisModel from "shared/models/rawNosTalentsNosEmplois.model"
import rawToulouseMetropoleModel from "shared/models/rawToulouseMetropole.model"
import rawViteUnEmploiModel from "shared/models/rawViteUnEmploi.model"

import { importCleverConnectRaw, importCleverConnectToComputed } from "./importCleverConnect"
import config from "@/config"

const cleverConnectProcessor = async (model: { collectionName: CollectionName }, label: JOBPARTNERS_LABEL, url: string) => {
  await importCleverConnectRaw(model.collectionName, label, url)
  await importCleverConnectToComputed(model.collectionName, label)
}

export const processAtlas = async () => cleverConnectProcessor(rawAtlasModel, JOBPARTNERS_LABEL.ATLAS, config.cleverConnect.atlasUrl)
export const processMeteojob = async () => cleverConnectProcessor(rawMeteojobModel, JOBPARTNERS_LABEL.METEOJOB, config.cleverConnect.meteojobUrl)
export const processViteUnEmploi = async () => cleverConnectProcessor(rawViteUnEmploiModel, JOBPARTNERS_LABEL.VITE_UN_EMPLOI, config.cleverConnect.viteUnEmploi)
export const processToulouseMetropole = async () => cleverConnectProcessor(rawToulouseMetropoleModel, JOBPARTNERS_LABEL.TOULOUSE_METROPOLE, config.cleverConnect.toulouseMetropole)
export const processNosTalentsNosEmplois = async () =>
  cleverConnectProcessor(rawNosTalentsNosEmploisModel, JOBPARTNERS_LABEL.NOS_TALENTS_NOS_EMPLOIS, config.cleverConnect.nosTaletsNosEmplois)
