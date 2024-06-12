import { z } from "zod"

import apicallsModel from "./apicalls.model"
import applicationsModel from "./applications.model"
import appointmentsModel from "./appointments.model"
import cfaModel from "./cfa.model"
import { IModelDescriptor } from "./common"
import credentialsModel from "./credentials.model"
import customEmailETFAModel from "./customEmailETFA.model"
import diplomesMetiersModel from "./diplomesMetiers.model"
import domainesMetiersModel from "./domainesMetiers.model"
import elligibleTrainingModel from "./elligibleTraining.model"
import emailBlacklistModel from "./emailBlacklist.model"
import entrepriseModel from "./entreprise.model"
import etablissementModel from "./etablissement.model"
import formationModel from "./formation.model"
import geolocationsModel from "./geolocations.model"
import lbaCompanyModel from "./lbaCompany.model"
import lbaCompanyLegacyModel from "./lbaCompanyLegacy.model"
import optoutModel from "./optout.model"
import recruiterModel from "./recruiter.model"
import referentielOnisepModel from "./referentielOnisep.model"
import referentielOpcoModel from "./referentielOpco.model"
import roleManagementModel from "./roleManagement.model"
import sessionModel from "./session.model"
import unsubscribedLbaCompanyModel from "./unsubscribedLbaCompany.model"
import unsubscribeOFModel from "./unsubscribeOF.model"
import userModel from "./user.model"
import userWithAccountModel from "./userWithAccount.model"

const modelDescriptorMap = {
  [appointmentsModel.collectionName]: appointmentsModel,
  [apicallsModel.collectionName]: apicallsModel,
  [applicationsModel.collectionName]: applicationsModel,
  [cfaModel.collectionName]: cfaModel,
  [credentialsModel.collectionName]: credentialsModel,
  [customEmailETFAModel.collectionName]: customEmailETFAModel,
  [diplomesMetiersModel.collectionName]: diplomesMetiersModel,
  [domainesMetiersModel.collectionName]: domainesMetiersModel,
  [elligibleTrainingModel.collectionName]: elligibleTrainingModel,
  [emailBlacklistModel.collectionName]: emailBlacklistModel,
  [entrepriseModel.collectionName]: entrepriseModel,
  [etablissementModel.collectionName]: etablissementModel,
  [formationModel.collectionName]: formationModel,
  [geolocationsModel.collectionName]: geolocationsModel,
  [lbaCompanyModel.collectionName]: lbaCompanyModel,
  [lbaCompanyLegacyModel.collectionName]: lbaCompanyLegacyModel,
  [optoutModel.collectionName]: optoutModel,
  [recruiterModel.collectionName]: recruiterModel,
  [referentielOnisepModel.collectionName]: referentielOnisepModel,
  [referentielOpcoModel.collectionName]: referentielOpcoModel,
  [roleManagementModel.collectionName]: roleManagementModel,
  [sessionModel.collectionName]: sessionModel,
  [unsubscribedLbaCompanyModel.collectionName]: unsubscribedLbaCompanyModel,
  [unsubscribeOFModel.collectionName]: unsubscribeOFModel,
  [userModel.collectionName]: userModel,
  [userWithAccountModel.collectionName]: userWithAccountModel,
} as const satisfies Record<string, IModelDescriptor>

export const modelDescriptors = Object.values(modelDescriptorMap) as (typeof modelDescriptorMap)[keyof typeof modelDescriptorMap][] satisfies IModelDescriptor[]

export type CollectionName = keyof typeof modelDescriptorMap

export type IDocument<Name extends CollectionName> = z.output<(typeof modelDescriptorMap)[Name]["zod"]>
