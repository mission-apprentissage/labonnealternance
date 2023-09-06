import ApiCalls from "./schema/apiCall/apiCall.schema"
import Application from "./schema/application/applications.schema"
import AppointmentDetailed from "./schema/appointmentDetailed/appointmentDetailed.schema"
import Appointment from "./schema/appointments/appointment.schema"
import BonnesBoites from "./schema/bonneboite/bonneBoite.schema"
import BonneBoiteLegacy from "./schema/bonneboitelegacy/bonneBoiteLegacy.schema"
import Credential from "./schema/credentials/credential.schema"
import DiplomesMetiers from "./schema/diplomesmetiers/diplomesmetiers.schema"
import DomainesMetiers from "./schema/domainesmetiers/domainesmetiers.schema"
import EligibleTrainingsForAppointment from "./schema/eligibleTrainingsForAppointment/eligibleTrainingsForAppointment.schema"
import eligibleTrainingsForAppointmentHistory from "./schema/eligibleTrainingsForAppointmentsHistory/eligibleTrainingsForAppointmentHistory.schema"
import EmailBlacklist from "./schema/emailBlacklist/emailBlacklist.schema"
import Etablissement from "./schema/etablissements/etablissement.schema"
import FormationCatalogue from "./schema/formationCatalogue/formationCatalogue.schema"
import GeoLocation from "./schema/geolocation/geolocation.schema"
import InternalJobs from "./schema/internalJobs/internalJobs.schema"
import Job from "./schema/jobs/jobs.schema"
import Opco from "./schema/opco/opco.schema"
import Optout from "./schema/optout/optout.schema"
import ParcoursupEtablissementStat from "./schema/parcoursupEtablissementStat/parcoursupEtablissementStat.schema"
import Recruiter from "./schema/recruiter/recruiter.schema"
import ReferentielOnisep from "./schema/referentielOnisep/referentielOnisep.schema"
import ReferentielOpco from "./schema/referentielOpco/referentielOpco.schema"
import ReferentielRome from "./schema/referentielRome/referentielRome.schema"
import RncpRomes from "./schema/rncpRomes/rncpRomes.schema"
import UnsubscribedBonneBoite from "./schema/unsubscribedBonneboite/unsubscribedBonneBoite.schema"
import UnsubscribeOF from "./schema/unsubscribedOF/unsubscribeOF.schema"
import User from "./schema/user/user.schema"
import UserRecruteur from "./schema/userRecruteur/usersRecruteur.schema"

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
  InternalJobs,
  Optout,
  ReferentielOpco,
  ReferentielOnisep,
  RncpRomes,
  UserRecruteur,
  AppointmentDetailed,
  eligibleTrainingsForAppointmentHistory,
  BonneBoiteLegacy,
  UnsubscribedBonneBoite,
  UnsubscribeOF,
  ReferentielRome,
}
