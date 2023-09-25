import { zRoutes } from "shared/index"

import { optMode } from "../../common/model/constants/etablissement"
import { referrers } from "../../common/model/constants/referrers"
import { Server } from "../server"

export default (server: Server) => {
  server.get(
    "/api/constants",
    {
      schema: zRoutes.get["/api/constants"],
    },
    (req, res) => res.send({ referrers: Object.values(referrers), optMode: Object.values(optMode) })
  )
}
