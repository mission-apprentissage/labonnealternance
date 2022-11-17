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
            user.prenom = result.data.prenom
            user.nom = result.data.nom
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

  const getStatut = (statut) => {
    switch (statut) {
      case "VALIDÉ":
        return <Badge variant="active">{statut}</Badge>
      case "EN ATTENTE DE VALIDATION":
        return <Badge variant="awaiting">{statut}</Badge>
      case "DESACTIVÉ":
        return <Badge variant="inactive">{statut}</Badge>
      default:
        return <Badge>{statut}</Badge>
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
                .map(({ date, statut, prenom, nom, validation_type, motif, user }, i) => {
                  return (
                    <Tr>
                      <Td>{i + 1}</Td>
                      <Td>{dayjs(date).format("DD/MM/YYYY")}</Td>
                      <Td>{getStatut(statut)}</Td>
                      <Td>{validation_type}</Td>
                      <Td>{prenom && nom ? `${prenom} ${nom}` : <Badge>{user}</Badge>}</Td>
                      <Td>{motif}</Td>
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
