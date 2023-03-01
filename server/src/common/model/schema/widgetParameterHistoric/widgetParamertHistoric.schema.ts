import { model } from "../../../mongodb.js"
import { widgetParameterSchema } from "../widgetParameter/widgetParameter.schema.js"
import { IWidgetParameter } from "../widgetParameter/widgetParameter.types.js"

export default model<IWidgetParameter>("widgetParametersHitoric", widgetParameterSchema)
