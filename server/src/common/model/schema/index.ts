import { apiCallSchema } from "./ApiCall.js"
import { applicationSchema } from "./applications.js"
import { appointmentSchema } from "./appointment.js"
import { credentialSchema } from "./credentials.js"
import { diplomesMetiersSchema } from "./diplomesmetiers.js"
import { domainesMetiersSchema } from "./domainesmetiers.js"
import { etablissementSchema } from "./etablissement.js"
import { formulaireSchema } from "./formulaire.js"
import { bonneBoiteSchema } from "./lbb/bonneBoite.js"
import { emailBlacklist } from "./lbb/emailBlacklist.js"
import { geoLocationSchema } from "./lbb/geoLocations.js"
import { opco } from "./lbb/opco.js"
import { mnaFormationSchema } from "./mnaFormation/mnaFormation.js"
import { offreSchema } from "./offre.js"
import { optoutSchema } from "./optout.js"
import { parcoursupEtablissementStatSchema } from "./parcoursupEtablissementStat.js"
import { userRecruteurSchema } from "./recruteur/users.js"
import { referentielOpcoSchema } from "./referentielOpco.js"
import { userSchema } from "./user.js"
import { widgetParameterSchema } from "./widgetParameter.js"

export default {
  domainesMetiersSchema,
  diplomesMetiersSchema,
  applicationSchema,
  apiCallSchema,
  mnaFormationSchema,
  bonneBoiteSchema,
  geoLocationSchema,
  emailBlacklist,
  opco,
  userSchema,
  appointmentSchema,
  widgetParameterSchema,
  etablissementSchema,
  parcoursupEtablissementStatSchema,
  formulaireSchema,
  offreSchema,
  referentielOpcoSchema,
  optoutSchema,
  userRecruteurSchema,
  credentialSchema,
}
