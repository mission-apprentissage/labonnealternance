import type { IDiplomeSeoData } from "../types"
import { btsCg } from "./bts-cg"
import { btsCommunication } from "./bts-communication"
import { btsGpme } from "./bts-gpme"
import { btsMco } from "./bts-mco"
import { btsNdrc } from "./bts-ndrc"
import { btsSam } from "./bts-sam"
import { btsSio } from "./bts-sio"
import { capAepe } from "./cap-aepe"
import { licenceProRh } from "./licence-pro-rh"
import { titreProSecretaireMedicale } from "./titre-pro-secretaire-medicale"

export const diplomesData: Record<string, IDiplomeSeoData> = {
  "bts-cg": btsCg,
  "bts-communication": btsCommunication,
  "bts-gpme": btsGpme,
  "bts-mco": btsMco,
  "bts-ndrc": btsNdrc,
  "bts-sam": btsSam,
  "bts-sio": btsSio,
  "cap-aepe": capAepe,
  "licence-pro-rh": licenceProRh,
  "titre-pro-secretaire-medicale": titreProSecretaireMedicale,
}
