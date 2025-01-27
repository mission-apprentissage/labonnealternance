import { importFromUrlInXml } from "../importFromUrlInXml"

export const importKelio = async () => {
  await importFromUrlInXml({ destinationCollection: "raw_kelio", url: "plop", offerXmlTag: "job", partnerLabel: "kelio" })
}
