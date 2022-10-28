import { domainesMetiersSchema } from "./domainesmetiers";
import { diplomesMetiersSchema } from "./diplomesmetiers";
import { apiCallSchema } from "./ApiCall";
import { applicationSchema } from "./applications";
import { sourceFormationsSchema } from "./sourceFormationsSchema";
import mnaFormationSchema from "./mnaFormation/mnaFormation";
import { geoLocationSchema } from "./lbb/geoLocations";
import { bonneBoiteSchema } from "./lbb/bonneBoite";
import { emailBlacklist } from "./lbb/emailBlacklist";
import { opco } from "./lbb/opco";
import { logSchema } from "./log";
import { userSchema } from "./user";
import { appointmentSchema } from "./appointment";
import { widgetParameterSchema } from "./widgetParameter";
import { etablissementSchema } from "./etablissement";
import { parcoursupEtablissementStatSchema } from "./parcoursupEtablissementStat";

export default {
  domainesMetiersSchema,
  diplomesMetiersSchema,
  applicationSchema,
  apiCallSchema,
  mnaFormationSchema,
  sourceFormationsSchema,
  bonneBoiteSchema,
  geoLocationSchema,
  emailBlacklist,
  opco,
  logSchema,
  userSchema,
  appointmentSchema,
  widgetParameterSchema,
  etablissementSchema,
  parcoursupEtablissementStatSchema,
};
