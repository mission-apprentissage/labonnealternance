import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Image,
  Input,
  Link,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react"
import dayjs from "dayjs"
import { Formik } from "formik"
import omit from "lodash/omit"
import { useRouter } from "next/router"
import { useContext, useState } from "react"
import { useQuery } from "react-query"
import { TRAINING_CONTRACT_TYPE, TRAINING_RYTHM } from "shared/constants/recruteur"
import { JOB_STATUS } from "shared/models/job.model"
import * as Yup from "yup"

import { useAuth } from "@/context/UserContext"

import { AUTHTYPE } from "../../common/contants"
import { publicConfig } from "../../config.public"
import { LogoContext } from "../../context/contextLogo"
import { WidgetContext } from "../../context/contextWidget"
import { ArrowRightLine, ExternalLinkLine, InfoCircle, Minus, Plus, Warning } from "../../theme/components/icons"
import { J1S, Parcoursup } from "../../theme/components/logos_pro"
import { createOffre, createOffreByToken, getFormulaire, getFormulaireByToken, getRelatedEtablissementsFromRome, getRomeDetail } from "../../utils/api"

import DropdownCombobox from "./DropdownCombobox"

const DATE_FORMAT = "YYYY-MM-DD"
const URL_LBA = publicConfig.apiEndpoint

const ChampNombre = ({ value, max, name, handleChange, label, dataTestId }) => {
  return (
    <Flex align="center" data-testid={dataTestId}>
      <Text flexGrow={2}>{label}</Text>
      <Stack direction="row" align="center">
        <Button onClick={() => handleChange(name, value - 1)} isDisabled={value === 1} variant="secondary" data-testid="-">
          <Minus />
        </Button>
        <Text minW="50px" my={3} textAlign="center" data-testid={`${dataTestId}-value`}>
          {value}
        </Text>
        <Button onClick={() => handleChange(name, value + 1)} isDisabled={value === max} variant="secondary" data-testid="+">
          <Plus />
        </Button>
      </Stack>
    </Flex>
  )
}

const FormulaireOffreLba = (props) => {
  const {
    widget: { isWidget },
  } = useContext(WidgetContext)
  const [haveProposals, setHaveProposals] = useState(false)
  const router = useRouter()

  const { establishment_id, email, userId, type, token } = router.query as { establishment_id: string; email: string; userId: string; type: string; token: string }
  const { data: formulaire } = useQuery("offre-liste", {
    enabled: !!establishment_id,
    queryFn: () => (token ? getFormulaireByToken(establishment_id, token) : getFormulaire(establishment_id)),
  })

  const { user } = useAuth()

  const minDate = dayjs().format(DATE_FORMAT)

  const { organisation } = useContext(LogoContext)

  const handleJobSearch = async (search) => {
    if (search.trim().length !== 0) {
      try {
        // KBA 20230214 : update api call.
        const result = await fetch(`${URL_LBA}/v1/metiers/intitule?label=${search}`)
        const data = await result.json()
        return data.coupleAppellationRomeMetier
      } catch (error) {
        throw new Error(error)
      }
    }
    return []
  }

  /**
   * @description Handles redirection after submit.
   * @param {Object} form - Formulaire
   * @param {Object} offre - Offre
   * @param {boolean} fromDashboard - Becomes from connected interface or anonymous.
   * @return {void}
   */
  const handleRedirectionAfterSubmit = (form, job, fromDashboard, jobToken) => {
    if (haveProposals) {
      return router.replace({
        pathname: isWidget ? "/espace-pro/widget/entreprise/mise-en-relation" : "/espace-pro/creation/mise-en-relation",
        query: { job: JSON.stringify(omit(job, "rome_detail")), email, geo_coordinates: form.geo_coordinates, fromDashboard, userId, establishment_id, token: jobToken },
      })
    }

    router.replace({
      pathname: isWidget ? "/espace-pro/widget/entreprise/fin" : "/espace-pro/creation/fin",
      query: { job: JSON.stringify(omit(job, "rome_detail")), email, withDelegation: false, fromDashboard, userId, establishment_id, token: jobToken },
    })
  }

  /**
   * @description Submits form from in a connected context.
   * @param values
   * @param resetForm
   * @return {Promise<void>}
   */
  const submitFromDashboard = async (values, { resetForm }) => {
    if (user && user.type !== AUTHTYPE.ENTREPRISE) {
      await props.handleSave(values)
    } else {
      const res = await props.handleSave(values)

      // Only redirect user in case of offer creation
      if (res) {
        await handleRedirectionAfterSubmit(res.form, res.offre, true, null)
      }
    }

    resetForm({})
  }

  /**
   * @description Submits the form.
   * If there are some CFA proposals, user will be redirected on the CFA selection page.
   * Otherwise, he's redirected at the end of the form.
   * @param values
   * @return {Promise<void>}
   */
  const submitFromDepotRapide = async (values) => {
    const { recruiter: formulaire, token: jobToken } = await (token ? createOffreByToken(establishment_id, values, token) : createOffre(establishment_id, values))
    const [job] = formulaire.jobs.slice(-1)
    await handleRedirectionAfterSubmit(formulaire, job, false, jobToken)
  }

  /**
   * @description Checks if there are proposals for this ROME and company.
   * @param {string} rome
   * @return {Promise<void>}
   */
  const checkIfThereAreProposal = async (rome: string) => {
    /**
     * KBA 20220105: Issue comes from address API if it's down or no result is found
     */
    const { geo_coordinates } = formulaire
    if (!geo_coordinates || geo_coordinates === "NOT FOUND") {
      setHaveProposals(false)
      return
    }
    const [latitude, longitude] = geo_coordinates.split(",").map((str) => parseFloat(str))
    const { data } = await getRelatedEtablissementsFromRome({ rome, latitude, longitude })
    setHaveProposals(!!data.length)
  }

  return (
    <Formik
      validateOnMount
      enableReinitialize={true}
      initialValues={{
        rome_label: props.rome_label ?? "",
        rome_appellation_label: props.rome_appellation_label ?? "",
        rome_code: props.rome_code ?? [],
        job_level_label: props.job_level_label ?? "",
        job_start_date: props.job_start_date ? dayjs(props.job_start_date).format(DATE_FORMAT) : "",
        job_description: props.job_description ?? undefined,
        job_creation_date: props.job_creation_date ?? dayjs().format(DATE_FORMAT),
        job_expiration_date: props.job_expiration_date ?? dayjs().add(2, "month").format(DATE_FORMAT),
        job_status: props.job_status ?? JOB_STATUS.ACTIVE,
        job_type: props.job_type ?? ["Apprentissage"],
        is_multi_published: props.is_multi_published ?? undefined,
        delegations: props.delegations ?? undefined,
        rome_detail: props.rome_detail ?? {},
        is_disabled_elligible: props.is_disabled_elligible ?? false,
        job_count: props.job_count ?? 1,
        job_duration: props.job_duration ?? 6,
        job_rythm: props.job_rythm ?? undefined,
        job_delegation_count: props.job_delegation_count ?? 0,
      }}
      validationSchema={Yup.object().shape({
        rome_label: Yup.string().required("Champ obligatoire"),
        job_level_label: Yup.string().required("Champ obligatoire"),
        job_start_date: Yup.date().required("Champ obligatoire"),
        job_type: Yup.array().required("Champ obligatoire"),
        job_duration: Yup.number().max(36, "Durée maximale du contrat : 36 mois").min(6, "Durée minimale du contrat : 6 mois").typeError("Durée minimale du contrat : 6 mois"),
        is_multi_published: Yup.boolean(),
      })}
      onSubmit={props.fromDashboard ? (values, bag) => submitFromDashboard(values, bag) : (values) => submitFromDepotRapide(values)}
    >
      {(formik) => {
        const { values, setFieldValue, handleChange, errors, touched, isValid, isSubmitting, dirty, submitForm } = formik
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Métier</FormLabel>
              <DropdownCombobox
                handleSearch={handleJobSearch}
                saveSelectedItem={(values) => {
                  /**
                   * validator broken when using setFieldValue : https://github.com/formium/formik/issues/2266
                   * work around until v3 : setTimeout
                   */
                  setTimeout(async () => {
                    await checkIfThereAreProposal(values.codeRome)
                    setFieldValue("rome_label", values.intitule)
                    setFieldValue("rome_appellation_label", values.appellation)
                    setFieldValue("rome_code", [values.codeRome])
                  }, 0)

                  props.getRomeInformation(values.codeRome, values.appellation, formik)
                }}
                name="rome_label"
                value={values.rome_appellation_label}
                placeholder="Rechercher un métier.."
                data-testid="offre-metier"
              />
            </FormControl>
            <FormControl mt={6}>
              <FormLabel>
                <Flex alignItems="flex-end">
                  Type de contrat en alternance{" "}
                  <Link
                    href="https://www.service-public.fr/professionnels-entreprises/vosdroits/F31704"
                    isExternal
                    ml={1}
                    aria-label="Accès au contrat en alternance - nouvelle fenêtre"
                  >
                    <Flex>
                      <Text fontSize="sm" color="grey.500">
                        en savoir plus
                      </Text>
                      <ExternalLinkLine color="grey.500" ml="3px" w={3} />
                    </Flex>
                  </Link>
                </Flex>
              </FormLabel>
              <CheckboxGroup
                onChange={(value) => {
                  setFieldValue("job_type", value)
                }}
                value={values.job_type}
                defaultValue={["Apprentissage"]}
              >
                <Stack direction="row" spacing={5} data-testid="offre-job-type">
                  {Object.values(TRAINING_CONTRACT_TYPE).map((label) => (
                    <Checkbox key={label} value={label}>
                      <span data-testid={label}>{label}</span>
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </FormControl>
            <FormControl mt={6} isRequired>
              <FormLabel>Niveau visé en fin d’études</FormLabel>
              <Select size="md" name="job_level_label" defaultValue={values.job_level_label} onChange={handleChange}>
                <option value="" hidden>
                  Choisissez un niveau
                </option>
                <option value="Indifférent">Indifférent</option>
                <option value="Cap, autres formations niveau (Infrabac)">Cap, autres formations niveau (Infrabac)</option>
                <option value="BP, Bac, autres formations niveau (Bac)">BP, Bac, autres formations niveau (Bac)</option>
                <option value="BTS, DEUST, autres formations niveau (Bac+2)">BTS, DEUST, autres formations niveau (Bac+2)</option>
                <option value="Licence, autres formations niveau (Bac+3)">Licence, autres formations niveau (Bac+3)</option>
                <option value="Master, titre ingénieur, autres formations niveau (Bac+5)">Master, titre ingénieur, autres formations niveau (Bac+5)</option>
              </Select>
              {errors.job_level_label && touched.job_level_label && <FormErrorMessage>{errors.job_level_label as string}</FormErrorMessage>}
            </FormControl>
            <FormControl mt={6} isRequired>
              <FormLabel>Date de début</FormLabel>
              <Input type="date" name="job_start_date" min={minDate} defaultValue={values.job_start_date} onChange={handleChange} />
            </FormControl>
            {organisation !== "atlas" && (
              <FormControl mt={6}>
                <Checkbox name="is_disabled_elligible" value={values.is_disabled_elligible} isChecked={values.is_disabled_elligible} onChange={handleChange}>
                  <Text ml={3}>
                    Je souhaite faire figurer sur l’offre la mention suivante: <br />
                    <Text as="cite">"À compétences égales, une attention particulière sera apportée aux personnes en situation de handicap."</Text>
                  </Text>
                </Checkbox>
              </FormControl>
            )}
            <FormControl mt={6}>
              <ChampNombre max={10} name="job_count" value={values.job_count} label="Nombre de poste(s) disponible(s)" handleChange={setFieldValue} dataTestId="offre-job-count" />
            </FormControl>
            {/* @ts-expect-error: TODO */}
            <FormControl mt={6} isInvalid={errors.job_duration}>
              <Flex align="center">
                <Text flexGrow={2}>Durée du contrat (mois)</Text>
                <Input
                  maxW="27%"
                  name="job_duration"
                  value={values.job_duration}
                  onChange={(e) => (parseInt(e.target.value) > 0 ? setFieldValue("job_duration", parseInt(e.target.value)) : setFieldValue("job_duration", null))}
                />
              </Flex>
              <FormErrorMessage>
                <Flex direction="row" alignItems="center">
                  <Warning m={0} />
                  <Flex ml={1}>{errors.job_duration as string}</Flex>
                </Flex>
              </FormErrorMessage>
            </FormControl>
            {Boolean((user && user.type !== AUTHTYPE.ENTREPRISE) || (type && type !== AUTHTYPE.ENTREPRISE)) && (
              <FormControl mt={6}>
                <FormLabel>Rythme de l'alternance (formation / entreprise)</FormLabel>
                <FormHelperText pb={2}>Facultatif</FormHelperText>
                <Select variant="outline" size="md" name="job_rythm" defaultValue={values.job_rythm} onChange={handleChange}>
                  <option value="" hidden>
                    Choisissez un rythme
                  </option>
                  {Object.values(TRAINING_RYTHM).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
                {errors.job_rythm && touched.job_rythm && <FormErrorMessage>{errors.job_rythm as string}</FormErrorMessage>}
              </FormControl>
            )}
            <Divider mt={5} />
            {(values.job_description || organisation?.includes("akto")) && (
              <FormControl mt={6}>
                <FormLabel>Description</FormLabel>
                {/* @ts-expect-error: TODO */}
                <Textarea rows="6" name="job_description" defaultValue={values.job_description} onChange={handleChange} />
                <FormHelperText>
                  Insérer ici une description de l'offre d'apprentissage, un lien vers la fiche de poste ou tout élément permettant de présenter le poste à pourvoir.
                </FormHelperText>
              </FormControl>
            )}
            <Flex justify="flex-end" my={8}>
              <Button variant="secondary" onClick={() => router.back()} mr={4}>
                Annuler
              </Button>
              <Button
                leftIcon={<ArrowRightLine />}
                variant="form"
                isDisabled={!(isValid && dirty) || isSubmitting}
                isActive={isValid && dirty}
                onClick={submitForm}
                data-testid="creer-offre"
              >
                {props._id ? "Mettre à jour" : "Créer l'offre"}
              </Button>
            </Flex>
          </>
        )
      }}
    </Formik>
  )
}

const RomeInformationDetail = ({ definition, competencesDeBase, libelle, appellation, acces }) => {
  if (definition) {
    const definitionSplitted = definition.split("\\n")
    const accesFormatted = acces.split("\\n").join("<br><br>")

    return (
      <Box border="1px solid #000091" p={5} mb={5}>
        <Box mb={5}>
          <Heading fontSize="24px" mb={3}>
            {appellation}
          </Heading>
          <Text fontSize="16px" fontWeight="700">
            Fiche métier : {libelle}
          </Text>
          <Text fontSize="14px">La fiche métier se base sur la classification ROME de Pôle Emploi</Text>
        </Box>
        <Flex alignItems="flex-start" mb={6}>
          <InfoCircle mr={2} mt={1} color="bluefrance.500" />
          <Text textAlign="justify">Voici la description visible par les candidats lors de la mise en ligne de l’offre d’emploi en alternance.</Text>
        </Flex>

        <Accordion defaultIndex={[0]} allowMultiple>
          <AccordionItem key={0} id="metier">
            {({ isExpanded }) => (
              <>
                <h2>
                  <AccordionButton>
                    <Text fontWeight="700" flex="1" textAlign="left">
                      Description du métier
                    </Text>
                    {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4} ml={6} mr={3}>
                  <ul className="voeuxUl">
                    {definitionSplitted.map((x) => {
                      return (
                        <li className="voeuxUlLi" key={x}>
                          {x}
                        </li>
                      )
                    })}
                  </ul>
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
          <hr />
          <AccordionItem key={1} id="competence">
            {({ isExpanded }) => (
              <>
                <h2>
                  <AccordionButton>
                    <Text fontWeight="700" flex="1" textAlign="left">
                      Quelles sont les compétences visées ?
                    </Text>
                    {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
                  </AccordionButton>
                </h2>
                <AccordionPanel maxH="50%" pb={4} ml={6} mr={3}>
                  <ul className="voeuxUl">
                    {competencesDeBase.map((x) => (
                      <li className="voeuxUlLi" key={x.libelle}>
                        {x.libelle}
                      </li>
                    ))}
                  </ul>
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
          <hr />
          <AccordionItem key={2} id="accessibilite">
            {({ isExpanded }) => (
              <>
                <h2>
                  <AccordionButton>
                    <Text fontWeight="700" flex="1" textAlign="left">
                      À qui ce métier est-il accessible ?
                    </Text>
                    {isExpanded ? <Minus color="bluefrance.500" /> : <Plus color="bluefrance.500" />}
                  </AccordionButton>
                </h2>
                <AccordionPanel maxH="50%" pb={4}>
                  <span dangerouslySetInnerHTML={{ __html: accesFormatted }}></span>
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
        </Accordion>
      </Box>
    )
  } else {
    return (
      <Box border="1px solid #000091" p={5}>
        <Heading fontSize="24px" mb={3}>
          Dites-nous en plus sur votre besoin en recrutement
        </Heading>
        <Flex alignItems="flex-start" mb={6} justify="flex-start">
          <InfoCircle mr={2} mt={1} color="bluefrance.500" />
          <Text textAlign="justify">Cela permettra à votre offre d'être visible des candidats intéressés.</Text>
        </Flex>
        <Box ml={5}>
          <Text>Une fois créée, votre offre d’emploi sera immédiatement mise en ligne sur les sites suivants : </Text>
          <Stack direction={["column", "row"]} spacing={2} align="center" justify="center" mt={3}>
            <Image src="/images/logo_LBA.svg" alt="" minWidth="150px" width="150px" />
            <J1S w="100px" h="100px" />
            <Parcoursup w="220px" h="100px" />
          </Stack>
        </Box>
      </Box>
    )
  }
}

export const PageFormulaireOffreLba = (props) => {
  const [romeInformation, setRomeInformation] = useState({})
  const [loading, setLoading] = useState(false)
  const { widget } = useContext(WidgetContext)

  const router = useRouter()
  const { establishment_id } = router.query

  const getRomeInformation = (rome: string, appellation, formik) => {
    getRomeDetail(rome)
      .then((result) => {
        setLoading(true)
        formik.setFieldValue("rome_detail", result.data)
        setRomeInformation({ appellation, ...result.data })
      })
      .catch((error) => console.error(error))
      .finally(() => {
        setTimeout(() => {
          setLoading(false)
        }, 700)
      })
  }

  if (!establishment_id) return <></>

  return (
    <SimpleGrid columns={[1, 1, 1, 2]} spacing={["35px", "35px", "35px", "75px"]}>
      <Box>
        {widget.isWidget && (
          <Text textTransform="uppercase" fontSize="20px" color="#666666">
            Dépot simplifié d'offre en alternance
          </Text>
        )}
        <Heading>Votre besoin de recrutement</Heading>
        <Text fontSize="20px" textAlign="justify" mt={2} mb={4}>
          Merci de renseigner les champs ci-dessous pour créer votre offre
        </Text>
        <Box>
          <FormulaireOffreLba {...props} getRomeInformation={getRomeInformation} />
        </Box>
      </Box>
      <Box>
        {loading ? (
          <Flex h="100%" justify="center" align="center" direction="column">
            <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
            <Text>Recherche en cours...</Text>
          </Flex>
        ) : (
          <RomeInformationDetail {...(romeInformation as any)} />
        )}
      </Box>
    </SimpleGrid>
  )
}

export default PageFormulaireOffreLba
