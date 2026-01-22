import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import dayjs from "dayjs"
import type { IUserStatusValidationJson } from "shared"

import LoadingEmptySpace from "./LoadingEmptySpace"
import Badge from "@/app/(espace-pro)/_components/Badge"

const UserValidationHistory = ({ histories }: { histories: IUserStatusValidationJson[] }) => {
  if (histories.length === 0) {
    return <LoadingEmptySpace />
  }

  const getStatut = (status: IUserStatusValidationJson["status"]) => {
    // eslint-disable-next-line
    switch (status) {
      case "VALIDÉ":
        return <Badge variant="active">{status}</Badge>
      case "EN ATTENTE DE VALIDATION":
        return <Badge variant="awaiting">{status}</Badge>
      case "DESACTIVÉ":
        return <Badge variant="inactive">{status}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Box sx={{ mt: fr.spacing("5w") }}>
      <hr />
      <Box sx={{ mt: fr.spacing("5v") }}>
        <Typography sx={{ fontSize: "20px", fontWeight: 700 }}>Historique du compte</Typography>
        <Box sx={{ mt: fr.spacing("2w") }}>
          <Box className="fr-table">
            <Box className="fr-table__wrapper">
              <Box className="fr-table__container">
                <Box className="fr-table__content">
                  <Box component="table">
                    <Box component="caption" sx={{ fontSize: "20px !important", fontWeight: "700", mb: fr.spacing("1w") }}>
                      Historique des changements d'état du compte
                    </Box>
                    <Box component="thead">
                      <tr>
                        <th aria-label="numéro" id="numero_historique" scope="col">
                          #
                        </th>
                        <th scope="col" id="date_historique">
                          Date
                        </th>
                        <th scope="col" id="statut_historique">
                          Statut
                        </th>
                        <th scope="col" id="type_validation_historique">
                          Type de validation
                        </th>
                        <th scope="col" id="operateur_historique">
                          Opérateur
                        </th>
                        <th scope="col" id="motif_historique">
                          Motif
                        </th>
                      </tr>
                    </Box>
                    <Box component="tbody">
                      {histories
                        .map(({ date, status, validation_type, reason, user }, i) => {
                          return (
                            <tr key={i}>
                              <td headers="numero_historique">{i + 1}</td>
                              <td headers="date_historique">{dayjs(date).format("DD/MM/YYYY")}</td>
                              <td headers="statut_historique">{getStatut(status)}</td>
                              <td headers="type_validation_historique">{validation_type}</td>
                              <td headers="operateur_historique">{<Badge>{user}</Badge>}</td>
                              <td headers="motif_historique">{reason}</td>
                            </tr>
                          )
                        })
                        .reverse()}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default UserValidationHistory
