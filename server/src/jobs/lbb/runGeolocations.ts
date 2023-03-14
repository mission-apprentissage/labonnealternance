import { runScript } from "../scriptWrapper.js"
import updateGeoLocations from "./updateGeoLocations.js"

runScript(async () => {
  await updateGeoLocations()
})
