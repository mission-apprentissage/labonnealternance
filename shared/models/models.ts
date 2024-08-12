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
import elligibleTrainingHistoryModel from "./elligibleTrainingHistory.model"
import emailBlacklistModel from "./emailBlacklist.model"
import entrepriseModel from "./entreprise.model"
import etablissementModel from "./etablissement.model"
import formationModel from "./formation.model"
import franceTravailAccessModel from "./franceTravailAccess.model"
import geolocationsModel from "./geolocations.model"
import internalJobModel from "./internalJob.model"
import jobsModel from "./jobs.model"
import jobsPartnersModel from "./jobsPartners.model"
import jobsPartnersComputedModel from "./jobsPartnersComputed.model "
import opcoModel from "./opco.model"
import optoutModel from "./optout.model"
import rawHelloWorkModel from "./rawHelloWork.model"
import recruiterModel from "./recruiter.model"
import lbaCompanyModel from "./recruteurLba.model"
import lbaCompanyLegacyModel from "./recruteurLbaLegacy.model"
import recruteurLbaUpdateEventModel from "./recruteurLbaUpdateEvent.model"
import referentielOnisepModel from "./referentielOnisep.model"
import referentielOpcoModel from "./referentielOpco.model"
import roleManagementModel from "./roleManagement.model"
import romeModel from "./rome.model"
import sessionModel from "./session.model"
import siretDiffusibleStatusModel from "./siretDiffusibleStatus.model"
import unsubscribedLbaCompanyModel from "./unsubscribedRecruteurLba.model"
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
  [elligibleTrainingHistoryModel.collectionName]: elligibleTrainingHistoryModel,
  [emailBlacklistModel.collectionName]: emailBlacklistModel,
  [entrepriseModel.collectionName]: entrepriseModel,
  [etablissementModel.collectionName]: etablissementModel,
  [formationModel.collectionName]: formationModel,
  [franceTravailAccessModel.collectionName]: franceTravailAccessModel,
  [geolocationsModel.collectionName]: geolocationsModel,
  [internalJobModel.collectionName]: internalJobModel,
  [jobsModel.collectionName]: jobsModel,
  [jobsPartnersModel.collectionName]: jobsPartnersModel,
  [jobsPartnersComputedModel.collectionName]: jobsPartnersComputedModel,
  [lbaCompanyModel.collectionName]: lbaCompanyModel,
  [lbaCompanyLegacyModel.collectionName]: lbaCompanyLegacyModel,
  [opcoModel.collectionName]: opcoModel,
  [optoutModel.collectionName]: optoutModel,
  [rawHelloWorkModel.collectionName]: rawHelloWorkModel,
  [recruiterModel.collectionName]: recruiterModel,
  [recruteurLbaUpdateEventModel.collectionName]: recruteurLbaUpdateEventModel,
  [referentielOnisepModel.collectionName]: referentielOnisepModel,
  [referentielOpcoModel.collectionName]: referentielOpcoModel,
  [romeModel.collectionName]: romeModel,
  [roleManagementModel.collectionName]: roleManagementModel,
  [sessionModel.collectionName]: sessionModel,
  [siretDiffusibleStatusModel.collectionName]: siretDiffusibleStatusModel,
  [unsubscribedLbaCompanyModel.collectionName]: unsubscribedLbaCompanyModel,
  [unsubscribeOFModel.collectionName]: unsubscribeOFModel,
  [userModel.collectionName]: userModel,
  [userWithAccountModel.collectionName]: userWithAccountModel,
} as const satisfies Record<string, IModelDescriptor>

export const modelDescriptors = Object.values(modelDescriptorMap) as (typeof modelDescriptorMap)[keyof typeof modelDescriptorMap][] satisfies IModelDescriptor[]

export type CollectionName = keyof typeof modelDescriptorMap

export type IDocument<Name extends CollectionName> = z.output<(typeof modelDescriptorMap)[Name]["zod"]>
