import { Badge, Box, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react"
import dayjs from "dayjs"
import { memo, useCallback, useEffect, useState } from "react"
import { getUser } from "../api"
import LoadingEmptySpace from "./LoadingEmptySpace"

export default memo(({ histories }) => {
  const [historic, setHistoric] = useState([])

  const getValidator = useCallback(async () => {
    const buffer = await Promise.all(
      histories.map(async (user, i) => {
        if (user.user !== "SERVEUR") {
          try {
            let result = await getUser(user.user)
            user.first_name = result.data.first_name
            user.last_name = result.data.last_name
            return user
          } catch (error) {
            console.log(error)
          }
        }

        return user
      })
    )
    setHistoric(buffer)
  })

  useEffect(() => {
    getValidator()
  }, [historic.length > 0, histories])

  if (historic.length === 0) {
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
              {historic
                .map(({ date, status, first_name, last_name, validation_type, reason, user }, i) => {
                  return (
                    <Tr>
                      <Td>{i + 1}</Td>
                      <Td>{dayjs(date).format("DD/MM/YYYY")}</Td>
                      <Td>{getStatut(status)}</Td>
                      <Td>{validation_type}</Td>
                      <Td>{first_name && last_name ? `${first_name} ${last_name}` : <Badge>{user}</Badge>}</Td>
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
})
