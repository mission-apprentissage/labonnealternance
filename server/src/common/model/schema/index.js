import { domainesMetiersSchema } from "./domainesmetiers.js";
import { diplomesMetiersSchema } from "./diplomesmetiers.js";
import { apiCallSchema } from "./ApiCall.js";
import { applicationSchema } from "./applications.js";
import { sourceFormationsSchema } from "./sourceFormationsSchema.js";
import mnaFormationSchema from "./mnaFormation/mnaFormation.js";
import { geoLocationSchema } from "./lbb/geoLocations.js";
import { bonneBoiteSchema } from "./lbb/bonneBoite.js";
import { emailBlacklist } from "./lbb/emailBlacklist.js";
import { opco } from "./lbb/opco.js";

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
};
