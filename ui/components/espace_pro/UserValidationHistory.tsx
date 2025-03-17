import { Badge, Box, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react"
import dayjs from "dayjs"
import { IUserStatusValidationJson } from "shared"

import LoadingEmptySpace from "./LoadingEmptySpace"

export const UserValidationHistory = ({ histories }: { histories: IUserStatusValidationJson[] }) => {
  if (histories.length === 0) {
    return <LoadingEmptySpace />
  }

  const getStatut = (status) => {
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
    <Box mt={10}>
      <hr />
      <Box mt={5}>
        <Text fontSize="20px" fontWeight={700}>
          Historique du compte
        </Text>
        <TableContainer mt={4}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th>Type de validation</Th>
                <Th>Opérateur</Th>
                <Th>Motif</Th>
              </Tr>
            </Thead>
            <Tbody>
              {histories
                .map(({ date, status, validation_type, reason, user }, i) => {
                  return (
                    <Tr key={i}>
                      <Td>{i + 1}</Td>
                      <Td>{dayjs(date).format("DD/MM/YYYY")}</Td>
                      <Td>{getStatut(status)}</Td>
                      <Td>{validation_type}</Td>
                      <Td>{<Badge>{user}</Badge>}</Td>
                      <Td>{reason}</Td>
                    </Tr>
                  )
                })
                .reverse()}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  )
}

export default UserValidationHistory
