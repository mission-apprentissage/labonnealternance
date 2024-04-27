import anonymizedApplicationModelDescriptor, { IAnonymizedApplication } from "./anonymizedApplications.model"
import { IModelDescriptor } from "./common"

export const modelDescriptor: IModelDescriptor[] = [anonymizedApplicationModelDescriptor]

export type IDocumentMap = {
  anoymizedApplication: IAnonymizedApplication
}
