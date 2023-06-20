import React, { createRef, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import * as emailValidator from "email-validator"
import { Tbody, Tr, Thead, Td, Checkbox, Table, Flex, Box, Text, useToast, Spinner, Editable, Button, EditablePreview, Heading, EditableInput } from "@chakra-ui/react"
import { _get, _patch } from "../../../../common/httpClient"
import EtablissementComponent from "../components/EtablissementComponent"
import { Breadcrumb } from "../../../../common/components/Breadcrumb"
import { setTitle } from "../../../../common/utils/pageUtils"
import { formatDate } from "../../../../common/dayjs"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Check } from "../../../../theme/components/icons"

/**
 * @description Page that handle formation editions.
 * @returns {JSX.Element}
 */
const EditPage = () => {
  const { id } = useParams()
  const [parametersResult, setParametersResult] = useState()
  const [referrers, setReferrers] = useState()
  const [etablissement, setEtablissement] = useState()
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const title = "Gestion de l'établissement"
  setTitle(title)

  /**
   * @description Fetch initial data.
   * @return {Promise<void>}
   */
  const fetchData = async () => {
    try {
      setLoading(true)

      const [parametersResponse, referrers, etablissementResponse] = await Promise.all([getParameters(id), getReferrers(), getEtablissement(id)])

      setParametersResult(parametersResponse)
      setReferrers(referrers)
      setEtablissement(etablissementResponse.etablissements[0])
    } catch (error) {
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

  /**
   * @description Get all parameters.
   */
  useEffect(() => {
    fetchData()
  }, [id, toast])

  /**
   * @description Refresh parameters.
   * @returns {Promise<void>}
   */
  const refreshParameters = async () => {
    const parametersResponse = await getParameters(id)

    setParametersResult(parametersResponse)
  }

  /**
   * @description Returns all parameters from given sirent.
   * @param {String} id
   * @returns {Promise<*>}
   */
  const getParameters = (id) => _get(`/api/widget-parameters/parameters?query={"etablissement_siret":"${id}"}&limit=1000`)

  /**
   * @description Returns etablissement from its SIRET.
   * @param {String} siret
   * @returns {Promise<*>}
   */
  const getEtablissement = (siret) => _get(`/api/admin/etablissements/?query={"siret_formateur":"${siret}"}`)

  /**
   * @description Returns all referrers.
   * @returns {Promise<{code: {number}, name: {string}, full_name: {string}, url: {string}[]}>}
   */
  const getReferrers = async () => {
    const { referrers } = await _get(`/api/constants`)

    return referrers
  }

  /**
   * @description Patch parameters.
   * @param {string} id
   * @param {Object} body
   * @returns {Promise<void>}
   */
  const patchParameter = async (id, body) => {
    await _patch(`/api/widget-parameters/${id}`, body)
  }

  /**
   * @description Save email.
   * @param parameterId
   * @param email
   * @returns {Promise<string|number>}
   */
  const saveEmail = async (parameterId, email) => {
    if (!email && !emailValidator.validate(email)) {
      return toast({
        title: "Email de contact non valide.",
        status: "error",
        isClosable: true,
        position: "bottom-right",
      })
    }

    await patchParameter(parameterId, {
      email_rdv: email,
    })

    toast({
      title: "Email de contact mis à jour.",
      status: "success",
      isClosable: true,
      position: "bottom-right",
    })
  }

  /**
   * @description Handle referrer checkbox.
   * @param {Object} parameter
   * @param {Boolean} checked
   * @param {Object} referrer
   * @returns {Promise<void>}
   */
  const onCheckboxChange = async ({ parameter, checked, referrer }) => {
    // Add referrer
    if (checked) {
      await patchParameter(parameter._id, {
        referrers: parameter.referrers.map((ref) => ref.code).concat(referrer.code),
      })
      await refreshParameters()
    } else {
      await patchParameter(parameter._id, {
        referrers: parameter.referrers.map((ref) => ref.code).filter((item) => item !== referrer.code),
      })
      await refreshParameters()
    }
  }

  if (!parametersResult) {
    return <Spinner display="block" mx="auto" mt="10rem" />
  }

  return (
    <Box w="100%" pt={[4, 8]} px={[1, 1, 12, 24]} pb={40}>
      <Breadcrumb pages={[{ title: "Administration", to: "/admin" }, { title: title }]} />
      <Heading textStyle="h2" mt={5}>
        {title}
      </Heading>
      <Box>
        {parametersResult && etablissement && !loading && (
          <>
            <EtablissementComponent id={etablissement._id} />
            <Flex bg="white" mt={10} border="1px solid #E0E5ED" borderRadius="4px" borderBottom="none">
              <Text flex="1" fontSize="16px" p={5}>
                Formations
              </Text>
            </Flex>
            <Box border="1px solid #E0E5ED" overflow="auto" cursor="pointer">
              <Table w="150rem" bg="white">
                <Thead color="#ADB2BC">
                  <Td textStyle="sm">Catalogue</Td>
                  <Td textStyle="sm">CLE MINISTERE EDUCATIF</Td>
                  <Td textStyle="sm">INTITULE</Td>
                  <Td textStyle="sm">CODE POSTAL</Td>
                  <Td textStyle="sm">LOCALITE</Td>
                  <Td textStyle="sm">EMAIL</Td>
                  <Td textStyle="sm">DESACTIVER L'ECRASEMENT DU MAIL VIA LA SYNCHRONISATION CATALOGUE</Td>
                  <Td textStyle="sm">PUBLIE SUR LE CATALOGUE</Td>
                  <Td textStyle="sm">PARCOURSUP ID</Td>
                  <Td textStyle="sm">DERNIERE SYNCHRONISATION CATALOGUE</Td>
                  <Td textStyle="sm">
                    SOURCE <br />
                  </Td>
                </Thead>
                <Tbody>
                  {parametersResult.parameters.map((parameter) => {
                    const emailRef = createRef()
                    const emailFocusRef = createRef()

                    return (
                      <Tr key={parameter._id} _hover={{ bg: "#f4f4f4", transition: "0.5s" }} transition="0.5s">
                        <Td>
                          {parameter?.id_catalogue ? (
                            <a
                              href={`https://catalogue-apprentissage.intercariforef.org/recherche/formations?SEARCH=%22${encodeURIComponent(parameter.cle_ministere_educatif)}%22`}
                              title="Lien vers la formation du Catalogue"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLinkIcon w={6} h={6} />
                            </a>
                          ) : (
                            "N/C"
                          )}
                        </Td>
                        <Td>{parameter?.cle_ministere_educatif || "N/C"}</Td>
                        <Td>{parameter.formation_intitule}</Td>
                        <Td>{parameter.code_postal}</Td>
                        <Td>{parameter.localite}</Td>
                        <Td onClick={() => emailFocusRef.current.focus()}>
                          <Editable
                            defaultValue={parameter?.email_rdv}
                            style={{
                              border: "solid #dee2e6 1px",
                              padding: 5,
                              marginRight: 10,
                              borderRadius: 4,
                              minWidth: 350,
                            }}
                          >
                            <EditableInput ref={emailRef} type="email" _focus={{ border: "none" }} />
                            <EditablePreview ref={emailFocusRef} />
                          </Editable>
                          <Button mt={4} RootComponent="a" variant="primary" onClick={() => saveEmail(parameter._id, emailRef.current.value)}>
                            OK
                          </Button>
                        </Td>
                        <Td align="center">
                          <Checkbox
                            checked={parameter?.is_custom_email_rdv}
                            icon={<Check w="20px" h="18px" />}
                            defaultIsChecked={parameter?.is_custom_email_rdv}
                            onChange={(event) => patchParameter(parameter._id, { is_custom_email_rdv: event.target.checked })}
                          />
                        </Td>
                        <Td>{parameter?.catalogue_published ? "Oui" : "Non"}</Td>
                        <Td>{parameter?.id_parcoursup || "N/C"}</Td>
                        <Td>{parameter?.last_catalogue_sync ? formatDate(parameter?.last_catalogue_sync) : "N/A"}</Td>
                        <Td>
                          {referrers.map((referrer) => {
                            const parameterReferrers = parameter.referrers?.find((parameterReferrer) => parameterReferrer.code === referrer.code)

                            return (
                              <>
                                <Flex mt={1}>
                                  <Checkbox
                                    key={referrer.code}
                                    checked={!!parameterReferrers}
                                    value={!!parameterReferrers}
                                    icon={<Check w="20px" h="18px" />}
                                    defaultIsChecked={!!parameterReferrers}
                                    onChange={(event) =>
                                      onCheckboxChange({
                                        parameter,
                                        referrer,
                                        checked: event.target.checked,
                                      })
                                    }
                                  >
                                    <Text ml={2}>{referrer.name}</Text>
                                  </Checkbox>
                                </Flex>
                              </>
                            )
                          })}
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}

export default EditPage
