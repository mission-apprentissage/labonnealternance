import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { CollectionName } from "shared/models/models"
import rawAtlasModel from "shared/models/raw-atlas.model"
import rawMeteojobModel from "shared/models/raw-meteojob.model"
import rawNosTalentsNosEmploisModel from "shared/models/raw-nos-talents-nos-emplois.model"
import rawToulouseMetropoleModel from "shared/models/raw-toulouse-metropole.model"
import rawViteUnEmploiModel from "shared/models/raw-vite-un-emploi.model"
import config from "@/config"
import { importCleverConnectRaw, importCleverConnectToComputed } from "./importCleverConnect"

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
