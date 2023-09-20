import { Tbody, Tr, Thead, Td, Table, Flex, Box, Text } from "@chakra-ui/react"

import { AppointmentItemList } from "./AppointmentItemList"

/**
 * @description Appointments head table.
 * @param props
 * @returns {JSX.Element}
 */
export const RequestsBoardComponent = (props) => (
  <Box>
    <Flex bg="white" mt={10} border="1px solid #E0E5ED" borderBottom="none">
      <Text flex="1" fontSize="16px" p={5}>
        Rendez-vous
      </Text>
    </Flex>
    <Box border="1px solid #E0E5ED" overflow="auto" cursor="pointer">
      <Table w="300rem" bg="white">
        <Thead>
          <Tr color="#ADB2BC">
            <Td textStyle="sm" minW={40}>
              DATE
            </Td>
            <Td textStyle="sm" minW={40}>
              CANDIDAT
            </Td>
            <Td textStyle="sm" minW={40}>
              TÉLÉPHONE
            </Td>
            <Td textStyle="sm" minW={40}>
              EMAIL CANDIDAT
            </Td>
            <Td textStyle="sm" minW={40}>
              EMAIL CFA
            </Td>
            <Td textStyle="sm" minW={40}>
              ETABLISSEMENT
            </Td>
            <Td textStyle="sm" minW={40}>
              SIRET FORMATEUR
            </Td>
            <Td textStyle="sm" minW={40}>
              FORMATION
            </Td>
            <Td textStyle="sm" minW={40}>
              SITE DE PROVENANCE
            </Td>
            <Td textStyle="sm" minW={40}>
              MESSAGE
            </Td>
          </Tr>
        </Thead>
        <Tbody>
          {props.appointments.map((appointment, index) => (
            <AppointmentItemList key={appointment._id} appointment={appointment} index={index} />
          ))}
        </Tbody>
      </Table>
    </Box>
  </Box>
)
