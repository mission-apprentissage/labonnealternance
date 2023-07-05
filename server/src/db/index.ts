import ApiCalls from "./schema/apiCall/apiCall.schema.js"
import Application from "./schema/application/applications.schema.js"
import AppointmentDetailed from "./schema/appointmentDetailed/appointmentDetailed.schema.js"
import Appointment from "./schema/appointments/appointment.schema.js"
import BonnesBoites from "./schema/bonneboite/bonneBoite.schema.js"
import BonneBoiteLegacy from "./schema/bonneboitelegacy/bonneBoiteLegacy.schema.js"
import UnsubscribedBonneBoite from "./schema/unsubscribedBonneboite/unsubscribedBonneBoite.schema.js"
import Credential from "./schema/credentials/credential.schema.js"
import DiplomesMetiers from "./schema/diplomesmetiers/diplomesmetiers.schema.js"
import DomainesMetiers from "./schema/domainesmetiers/domainesmetiers.schema.js"
import EligibleTrainingsForAppointment from "./schema/eligibleTrainingsForAppointment/eligibleTrainingsForAppointment.schema.js"
import eligibleTrainingsForAppointmentHistoric from "./schema/eligibleTrainingsForAppointmentHistoric/eligibleTrainingsForAppointmentHistoric.schema.js"
import EmailBlacklist from "./schema/emailBlacklist/emailBlacklist.schema.js"
import Etablissement from "./schema/etablissements/etablissement.schema.js"
import FormationCatalogue from "./schema/formationCatalogue/formationCatalogue.schema.js"
import Recruiter from "./schema/recruiter/recruiter.schema.js"
import GeoLocation from "./schema/geolocation/geolocation.schema.js"
import Job from "./schema/jobs/jobs.schema.js"
import Opco from "./schema/opco/opco.schema.js"
import Optout from "./schema/optout/optout.schema.js"
import ParcoursupEtablissementStat from "./schema/parcoursupEtablissementStat/parcoursupEtablissementStat.schema.js"
import ReferentielOpco from "./schema/referentielOpco/referentielOpco.schema.js"
import User from "./schema/user/user.schema.js"
import UserRecruteur from "./schema/userRecruteur/usersRecruteur.schema.js"

export {
  DomainesMetiers,
  FormationCatalogue,
  DiplomesMetiers,
  ApiCalls,
  Application,
  GeoLocation,
  EmailBlacklist,
  Opco,
  BonnesBoites,
  User,
  Appointment,
  EligibleTrainingsForAppointment,
  Etablissement,
  ParcoursupEtablissementStat,
  Recruiter,
  Credential,
  Job,
  Optout,
  ReferentielOpco,
  UserRecruteur,
  AppointmentDetailed,
  eligibleTrainingsForAppointmentHistoric,
  BonneBoiteLegacy,
  UnsubscribedBonneBoite,
}
