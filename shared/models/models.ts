import { z } from "zod"

import apicallsModel from "./apicalls.model"
import appointmentsModel from "./appointments.model"
import { IModelDescriptor } from "./common"
import userWithAccountModel from "./userWithAccount.model"

const modelDescriptorMap = {
  [appointmentsModel.collectionName]: appointmentsModel,
  [apicallsModel.collectionName]: apicallsModel,
  [userWithAccountModel.collectionName]: userWithAccountModel,
} as const

export const modelDescriptors = Object.values(modelDescriptorMap) as (typeof modelDescriptorMap)[keyof typeof modelDescriptorMap][] satisfies IModelDescriptor[]

export type CollectionName = keyof typeof modelDescriptorMap

export type IDocument<Name extends CollectionName> = z.output<(typeof modelDescriptorMap)[Name]["zod"]>
