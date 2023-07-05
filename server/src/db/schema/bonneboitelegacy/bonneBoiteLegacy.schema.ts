import { model } from "../../../common/mongodb.js"
import { bonneBoiteSchema } from "../bonneboite/bonneBoite.schema.js"
import { IBonneBoite } from "../bonneboite/bonneboite.types.js"

export default model<IBonneBoite>("bonnesboiteslegacy", bonneBoiteSchema)
