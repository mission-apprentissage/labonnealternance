import { model } from "../../../mongodb"
import { bonneBoiteSchema } from "../bonneboite/bonneBoite.schema"
import { IBonneBoite } from "../bonneboite/bonneboite.types"

export default model<IBonneBoite>("bonnesboiteslegacy", bonneBoiteSchema)
