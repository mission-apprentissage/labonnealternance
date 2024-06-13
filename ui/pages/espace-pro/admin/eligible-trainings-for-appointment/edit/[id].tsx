import { ExternalLinkIcon } from "@chakra-ui/icons"
import {
  Box,
  Button,
  Checkbox,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  HStack,
  Heading,
  Link,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useToast,
} from "@chakra-ui/react"
import emailValidator from "email-validator"
import Head from "next/head"
import { useRouter } from "next/router"
import { createRef, useEffect, useState } from "react"
import { IEtablissementJson } from "shared"
import { referrers } from "shared/constants/referers"
import { IEligibleTrainingsForAppointmentJson } from "shared/models/elligibleTraining.model"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { InfoPopover, Layout } from "@/components/espace_pro"
import { apiGet, apiPatch } from "@/utils/api.utils"

import { formatDate } from "../../../../../common/dayjs"
import EtablissementComponent from "../../../../../components/espace_pro/Admin/widgetParameters/components/EtablissementComponent"
import { Breadcrumb } from "../../../../../components/espace_pro/common/components/Breadcrumb"
import { authProvider, withAuth } from "../../../../../components/espace_pro/withAuth"

/**
 * @description Page that handle formation editions.
 * @returns {JSX.Element}
 */
function EditPage() {
  const router = useRouter()
  const { id: idParam } = router.query
  const id = idParam as string
  const [eligibleTrainingsForAppointmentResult, setEligibleTrainingsForAppointmentResult] = useState<IEligibleTrainingsForAppointmentJson[]>([])
  const [etablissement, setEtablissement] = useState<IEtablissementJson>()
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const title = "Gestion de l'établissement"

  /**
   * @description Fetch initial data.
   * @return {Promise<void>}
   */
  const fetchData = async () => {
    try {
      setLoading(true)
      const [eligibleTrainingsForAppointmentsResponse, etablissementResponse] = await Promise.all([
        getEligibleTrainingsForAppointments(id).catch(() => null),
        getEtablissement(id).catch(() => null),
      ])
      if (eligibleTrainingsForAppointmentsResponse && etablissementResponse) {
        const { parameters: parametersResponse } = eligibleTrainingsForAppointmentsResponse
        setEligibleTrainingsForAppointmentResult(parametersResponse)
        setEtablissement(etablissementResponse)
      } else {
        setEligibleTrainingsForAppointmentResult(null)
        setEtablissement(null)
      }
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
    if (id) fetchData()
  }, [id, toast])

  const refreshParameters = async () => {
    const eligibleTrainingsForAppointmentsResponse = await getEligibleTrainingsForAppointments(id)

    const { parameters: parametersResponse } = eligibleTrainingsForAppointmentsResponse
    setEligibleTrainingsForAppointmentResult(parametersResponse)
  }

  const getEligibleTrainingsForAppointments = (siret: string) =>
    apiGet("/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret", { params: { siret: siret } })

  const getEtablissement = (siret: string) => apiGet("/admin/etablissements/siret-formateur/:siret", { params: { siret: siret } })

  /**
   * @description Patch eligibleTrainingsForAppointments.
   * @param {string} id
   * @param {Object} body
   * @returns {Promise<void>}
   */
  const patchEligibleTrainingsForAppointment = async (id, body) => {
    await apiPatch("/admin/eligible-trainings-for-appointment/:id", { params: { id }, body })
  }

  /**
   * @description Save email.
   * @param parameterId
   * @param email
   * @returns {Promise<string|number>}
   */
  const saveEmail = async (parameterId, email, cle_ministere_educatif) => {
    if (!email && !emailValidator.validate(email)) {
      return toast({
        title: "Email de contact non valide.",
        status: "error",
        isClosable: true,
        position: "bottom-right",
      })
    }

    await patchEligibleTrainingsForAppointment(parameterId, {
      lieu_formation_email: email,
      cle_ministere_educatif,
      is_lieu_formation_email_customized: true,
    })

    toast({
      title: "Email de contact mis à jour.",
      status: "success",
      isClosable: true,
      position: "bottom-right",
    })
  }

  /**
   * @description Disable/enable email overriding.
   * @param id
   * @param is_lieu_formation_email_customized
   * @return {Promise<void>}
   */
  const disableEmailOverriding = async (id, is_lieu_formation_email_customized) => {
    await patchEligibleTrainingsForAppointment(id, { is_lieu_formation_email_customized })
    await refreshParameters()
    if (is_lieu_formation_email_customized) {
      toast({
        title: "Lors de la prochaine synchronisation l'email ne sera pas écrasé car il est personnalisé.",
        status: "success",
        isClosable: true,
        position: "bottom-right",
      })
    } else {
      toast({
        title: "L'email sera mis à jour automatiquement lors de la prochaine synchronisation avec le Catalogue.",
        status: "success",
        isClosable: true,
        position: "bottom-right",
      })
    }
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
      await patchEligibleTrainingsForAppointment(parameter._id, {
        referrers: parameter.referrers.map((ref) => ref).concat(referrer.name),
      })
      await refreshParameters()
    } else {
      await patchEligibleTrainingsForAppointment(parameter._id, {
        referrers: parameter.referrers.map((ref) => ref).filter((item) => item !== referrer.name),
      })
      await refreshParameters()
    }
  }

  if (loading) {
    return (
      <Layout footer={false} rdva>
        <Spinner display="block" mx="auto" mt="10rem" />
      </Layout>
    )
  }

  return (
    <Layout footer={false} rdva>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon/favicon.ico" />
      </Head>
      <Breadcrumb pages={[{ title: "Administration", to: "/espace-pro/admin" }, { title: title }]} />
      <Heading textStyle="h2" mt={5}>
        {title}
      </Heading>
      <Box>
        {eligibleTrainingsForAppointmentResult ? (
          <>
            <EtablissementComponent id={etablissement?._id.toString()} />
            <Flex bg="white" mt={10} border="1px solid #E0E5ED" borderRadius="4px" borderBottom="none">
              <Text flex="1" fontSize="16px" p={5}>
                Formations
              </Text>
            </Flex>
            <Box border="1px solid #E0E5ED" overflow="auto" cursor="pointer">
              <Table bg="white">
                <Thead color="#ADB2BC">
                  <Tr>
                    <Th textStyle="sm" fontSize="0.8em" p="1px">
                      FORMATION
                    </Th>
                    <Th textStyle="sm" fontSize="0.8em" p="1px">
                      ADRESSE
                    </Th>
                    <Th textStyle="sm" fontSize="0.8em" p="1px">
                      LIEU FORMATION EMAIL
                    </Th>

                    <Th textStyle="sm" fontSize="0.8em" p="1px">
                      CATALOGUE
                    </Th>

                    <Th textStyle="sm" fontSize="0.8em" p="1px">
                      SOURCE
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {eligibleTrainingsForAppointmentResult.map((parameter, i) => {
                    const emailRef = createRef()
                    const emailFocusRef = createRef()

                    return (
                      <Tr key={i} _hover={{ bg: "#f4f4f4", transition: "0.5s" }} transition="0.5s" my={10}>
                        <Td fontSize="0.8em" px="1px">
                          <VStack alignItems="flex-start">
                            <Box>
                              <Text fontWeight="bold">Clé ministere educatif</Text> {parameter?.cle_ministere_educatif}
                            </Box>
                            <Box>
                              <Text fontWeight="bold">Id parcoursup </Text> {parameter?.parcoursup_id || "N/C"}
                            </Box>
                            <Box>
                              <Text fontWeight="bold">Intitulé</Text> {parameter?.training_intitule_long}
                            </Box>
                            <Link
                              href={`https://catalogue-apprentissage.intercariforef.org/recherche/formations?SEARCH=%22${encodeURIComponent(parameter.cle_ministere_educatif)}%22`}
                              title="La formation du Catalogue - nouvelle fenêtre"
                              isExternal
                              rel="noreferrer"
                              fontWeight="bold"
                            >
                              Lien catalogue <ExternalLinkIcon w={6} h={6} />
                            </Link>
                          </VStack>
                        </Td>

                        <Td fontSize="0.8em" px="1px">
                          <VStack w={150} spacing={0}>
                            <Text>{parameter.etablissement_formateur_street}</Text>
                            <Text mt={2}>{parameter.etablissement_formateur_zip_code}</Text>
                          </VStack>
                        </Td>
                        {/* @ts-expect-error: TODO */}
                        <Td onClick={() => emailFocusRef.current.focus()} fontSize="0.8em" px="1px">
                          <Editable
                            defaultValue={parameter?.lieu_formation_email}
                            style={{
                              border: "solid #dee2e6 1px",
                              padding: 5,
                              marginRight: 10,
                              borderRadius: 4,
                              minWidth: 225,
                            }}
                          >
                            {/* @ts-expect-error: TODO */}
                            <EditableInput ref={emailRef} type="email" _focus={{ border: "none" }} />
                            {/* @ts-expect-error: TODO */}
                            <EditablePreview ref={emailFocusRef} />
                          </Editable>
                          {/* @ts-expect-error: TODO */}
                          <Button mt={4} variant="primary" onClick={() => saveEmail(parameter._id, emailRef.current.value, parameter.cle_ministere_educatif)}>
                            OK
                          </Button>
                        </Td>
                        <Td align="center" fontSize="0.8em" px="1px">
                          <HStack spacing={0}>
                            <HStack w={150} spacing={0}>
                              <InfoPopover>DESACTIVER L'ECRASEMENT DU MAIL VIA LA SYNCHRONISATION CATALOGUE</InfoPopover>
                              <Text w={80}>DESACTIVER</Text>
                            </HStack>
                            <Checkbox
                              isChecked={parameter?.is_lieu_formation_email_customized}
                              defaultChecked={parameter?.is_lieu_formation_email_customized}
                              onChange={(event) => disableEmailOverriding(parameter._id, event.target.checked)}
                            />
                          </HStack>
                          <HStack spacing={0}>
                            <HStack w={150} spacing={0}>
                              <InfoPopover>PUBLIE SUR LE CATALOGUE</InfoPopover>
                              <Text w={80}>PUBLIÉ</Text>
                            </HStack>
                            <Text>{parameter?.is_catalogue_published ? "Oui" : "Non"}</Text>
                          </HStack>
                          <HStack spacing={0}>
                            <HStack w={150} spacing={0}>
                              <InfoPopover>DERNIERE SYNCHRONISATION CATALOGUE</InfoPopover>
                              <Text w={80}>SYNCHRO</Text>
                            </HStack>
                            <Text>{parameter?.last_catalogue_sync_date ? formatDate(parameter?.last_catalogue_sync_date) : "N/A"}</Text>
                          </HStack>
                        </Td>

                        <Td fontSize="0.8em" px="1px">
                          {Object.values(referrers).map((referrer, i) => {
                            const parameterReferrers = parameter.referrers?.find((parameterReferrer) => parameterReferrer === referrer.name)
                            return (
                              <Flex mt={1} key={i}>
                                <Checkbox
                                  key={referrer.name}
                                  isChecked={!!parameterReferrers}
                                  value={referrer.name}
                                  defaultChecked={!!parameterReferrers}
                                  onChange={(event) =>
                                    onCheckboxChange({
                                      parameter,
                                      referrer,
                                      checked: event.target.checked,
                                    })
                                  }
                                >
                                  <Text fontSize="0.8em">{referrer.name}</Text>
                                </Checkbox>
                              </Flex>
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
        ) : (
          <Text>Etablissement introuvable</Text>
        )}
      </Box>
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(EditPage, "admin"))
