import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import dayjs from "dayjs"
import { IUserStatusValidationJson } from "shared"

import Badge from "@/app/(espace-pro)/_components/Badge"

import LoadingEmptySpace from "./LoadingEmptySpace"

const UserValidationHistory = ({ histories }: { histories: IUserStatusValidationJson[] }) => {
  if (histories.length === 0) {
    return <LoadingEmptySpace />
  }

  const getStatut = (status: IUserStatusValidationJson["status"]) => {
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
                    <Box component="thead">
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Statut</th>
                        <th>Type de validation</th>
                        <th>Opérateur</th>
                        <th>Motif</th>
                      </tr>
                    </Box>
                    <Box component="tbody">
                      {histories
                        .map(({ date, status, validation_type, reason, user }, i) => {
                          return (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>{dayjs(date).format("DD/MM/YYYY")}</td>
                              <td>{getStatut(status)}</td>
                              <td>{validation_type}</td>
                              <td>{<Badge>{user}</Badge>}</td>
                              <td>{reason}</td>
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
