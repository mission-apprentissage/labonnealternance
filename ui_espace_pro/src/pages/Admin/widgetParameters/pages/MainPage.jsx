import { useEffect, useState } from "react"
import { sortBy } from "lodash"
import { useNavigate } from "react-router-dom"
import { Tbody, Tr, Thead, Tag, Td, Table, Flex, Box, Text, useToast, Button } from "@chakra-ui/react"
import { _get } from "../../../../common/httpClient"
import downloadFile from "../../../../common/utils/downloadFile"
import { Download } from "../../../../theme/components/icons"

const MainPage = () => {
  const [parametersResult, setParametersResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  /**
   * @description Get all parameters.
   */
  useEffect(() => {
    async function fetchParameters() {
      setLoading(true)
      try {
        const response = await _get('/api/widget-parameters/parameters?query={ "referrers": { "$ne": [] } }&limit=1000')

        response.parameters = response.parameters.reverse()

        setParametersResult(response)
      } catch (e) {
        toast({
          title: "Une erreur est survenue durant la récupération des informations.",
          status: "error",
          isClosable: true,
          position: "bottom-right",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchParameters()
  }, [toast])

  /**
   * @description Downloads CSV file.
   * @returns {Promise<void>}
   */
  const download = () => downloadFile(`/api/widget-parameters/parameters/export`, `parametres.csv`)

  return (
    <Box>
      <Flex bg="white" mx="10rem" mt={10} border="1px solid #E0E5ED" borderBottom="none">
        <Text flex="1" fontSize="16px" p={5}>
          Paramètres
        </Text>
        <Download onClick={download} color="#9AA0AC" cursor="pointer" w="16px" h="16px" mt={6} mr={5} />
      </Flex>
      <Box border="1px solid #E0E5ED" overflow="auto" mx="10rem" cursor="pointer">
        {loading && <Button loading color="primary" block />}
        {parametersResult && (
          <Table w="204rem" bg="white">
            <Thead>
              <Tr color="#ADB2BC">
                <Td textStyle="sm">SIRET</Td>
                <Td textStyle="sm">RAISON SOCIALE</Td>
                <Td textStyle="sm">INTITULE</Td>
                <Td textStyle="sm">CFD</Td>
                <Td textStyle="sm">EMAIL</Td>
                <Td textStyle="sm">WIDGET ACTIF</Td>
              </Tr>
            </Thead>
            <Tbody>
              {parametersResult.parameters.map((parameter) => (
                <Tr
                  _hover={{ bg: "#f4f4f4", transition: "0.5s" }}
                  transition="0.5s"
                  key={parameter._id}
                  onClick={() => navigate(`/admin/widget-parameters/edit/${parameter.etablissement_siret}`)}
                >
                  <Td>{parameter.etablissement_siret}</Td>
                  <Td>{parameter.etablissement_raison_sociale}</Td>
                  <Td>{parameter.formation_intitule}</Td>
                  <Td>{parameter.formation_cfd}</Td>
                  <Td>{parameter.email_rdv?.toLowerCase()}</Td>
                  <Td>
                    <Text>
                      {sortBy(parameter.referrers, "code").map((referrer) => (
                        <Tag key={referrer.code} bg="#467FCF" size="md" ml={2} color="white">
                          {referrer.full_name}
                        </Tag>
                      ))}
                    </Text>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Box>
  )
}

export default MainPage
