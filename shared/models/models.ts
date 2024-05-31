import anonymizedApplicationModelDescriptor, { IAnonymizedApplication } from "./anonymizedApplications.model"
import { IModelDescriptor } from "./common"
import { IRecruiter } from "./recruiter.model"
import { IUserWithAccount } from "./userWithAccount.model"

export const modelDescriptors: IModelDescriptor[] = [anonymizedApplicationModelDescriptor]

export type IDocumentMap = {
  anoymizedApplication: IAnonymizedApplication
  anonymized_users: { todo: "add_interface" }
  anonymizedapplications: { todo: "add_interface" }
  anonymizedappointments: { todo: "add_interface" }
  anonymizedrecruiters: { todo: "add_interface" }
  anonymizedusers2s: { todo: "add_interface" }
  apicalls: { todo: "add_interface" }
  appointments: { todo: "add_interface" }
  applications: { todo: "add_interface" }
  bonnesboites: { todo: "add_interface" }
  bonnesboiteslegacies: { todo: "add_interface" }
  cfas: { todo: "add_interface" }
  changelog: { todo: "add_interface" }
  credentials: { todo: "add_interface" }
  customemailetfas: { todo: "add_interface" }
  diplomesmetiers: { todo: "add_interface" }
  domainesmetiers: { todo: "add_interface" }
  eligible_trainings_for_appointments: { todo: "add_interface" }
  eligible_trainings_for_appointments_histories: { todo: "add_interface" }
  emailblacklists: { todo: "add_interface" }
  entreprises: { todo: "add_interface" }
  etablissements: { todo: "add_interface" }
  formationcatalogues: { todo: "add_interface" }
  geolocations: { todo: "add_interface" }
  internalJobs: { todo: "add_interface" }
  opcos: { todo: "add_interface" }
  optouts: { todo: "add_interface" }
  recruiters: IRecruiter
  referentieloniseps: { todo: "add_interface" }
  referentielopcos: { todo: "add_interface" }
  referentielromes: { todo: "add_interface" }
  rolemanagements: { todo: "add_interface" }
  sessions: { todo: "add_interface" }
  siretdiffusiblestatuses: { todo: "add_interface" }
  unsubscribedbonnesboites: { todo: "add_interface" }
  unsubscribedofs: { todo: "add_interface" }
  userrecruteurs: { todo: "add_interface" }
  users: { todo: "add_interface" }
  userswithaccounts: IUserWithAccount
}
