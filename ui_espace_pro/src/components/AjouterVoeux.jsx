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
import { useContext, useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import * as Yup from "yup"
import { getFormulaire, getRelatedEtablissementsFromRome, getRomeDetail, postOffre } from "../api"
import { AUTHTYPE } from "../common/contants"
import useAuth from "../common/hooks/useAuth"
import { LogoContext } from "../contextLogo"
import { WidgetContext } from "../contextWidget"
import { ArrowRightLine, ExternalLinkLine, InfoCircle, Minus, Plus } from "../theme/components/icons"
import { J1S, LbaCandidat, Parcoursup } from "../theme/components/logos"
import DropdownCombobox from "./DropdownCombobox"
import style from "./Voeux.module.css"

const DATE_FORMAT = "YYYY-MM-DD"
const URL_LBA =
  process.env.REACT_APP_ENV === "production" ? "https://labonnealternance.apprentissage.beta.gouv.fr/api" : "https://labonnealternance-recette.apprentissage.beta.gouv.fr/api"

const ChampNombre = ({ value, max, name, handleChange, label }) => {
  return (
    <Flex align="center">
      <Text flexGrow={2}>{label}</Text>
      <Stack direction="row" align="center">
        <Button onClick={() => handleChange(name, value - 1)} isDisabled={value === 1} variant="secondary">
          <Minus />
        </Button>
        <Text minW="50px" my={3} textAlign="center">
          {value}
        </Text>
        <Button onClick={() => handleChange(name, value + 1)} isDisabled={value === max} variant="secondary">
          <Plus />
        </Button>
      </Stack>
    </Flex>
  )
}

const AjouterVoeux = (props) => {
  const [inputJobItems, setInputJobItems] = useState([])
  const [formulaire, setFormulaire] = useState()
  const [haveProposals, setHaveProposals] = useState()
  const [toggleChangeAddress, setToggleChangeAddress] = useState(false)
  const [customAddress, setCustomAddress] = useState()
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const [auth] = useAuth()

  const id_form = location.state?.id_form
  const email = location.state?.email

  const minDate = dayjs().format(DATE_FORMAT)
  const { organisation } = useContext(LogoContext)

  const handleJobSearch = async (search) => {
    if (search.trim().length !== 0) {
      try {
        const result = await fetch(`${URL_LBA}/metiers/intitule?label=${search}`)
        const data = await result.json()
        return data.coupleAppellationRomeMetier
      } catch (error) {
        throw new Error(error)
      }
    }
    return inputJobItems
  }

  /**
   * @description Handles redirection after submit.
   * @param {Object} form - Formulaire
   * @param {Object} offre - Offre
   * @param {boolean} fromDashboard - Becomes from connected interface or anonymous.
   * @return {void}
   */
  const handleRedirectionAfterSubmit = (form, offre, fromDashboard) => {
    if (haveProposals) {
      return navigate("/creation/mise-en-relation", {
        replace: true,
        state: { offre, email, geo_coordonnees: form.geo_coordonnees, fromDashboard },
      })
    }

    navigate("/creation/fin", {
      replace: true,
      state: { offre, email, withDelegation: false, fromDashboard },
    })
  }

  /**
   * @description Add custom address if user set it.
   * @param {Object} values - Form
   * @return {Object} - Form
   */
  const addCustomAddressIfSet = (values) => {
    // If the user changed its offer address
    if (toggleChangeAddress && customAddress) {
      values.custom_adress = customAddress.name
      values.custom_gps_coordinates = customAddress.geo_coordonnees
    } else {
      values.custom_adress = null
      values.custom_gps_coordinates = null
    }

    return values
  }

  /**
   * @description Submits form from in a connected context.
   * @param values
   * @param resetForm
   * @return {Promise<void>}
   */
  const submitFromDashboard = async (values, { resetForm }) => {
    values = addCustomAddressIfSet(values)

    if (auth.type !== AUTHTYPE.ENTREPRISE) {
      await props.handleSave(values)
    } else {
      const res = await props.handleSave(values)

      // Only redirect user in case of offer creation
      if (res) {
        await handleRedirectionAfterSubmit(res.form, res.offre, true)
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
    // If the user changed its offer address
    values = addCustomAddressIfSet(values)

    const { data } = await postOffre(id_form, values)
    data.offres.slice(-1)
    const [offre] = data.offres.slice(-1)
    await handleRedirectionAfterSubmit(data, offre, false)
  }

  /**
   * @description Checks if there are proposals for this ROME and company.
   * @param {string} rome
   * @return {Promise<void>}
   */
  const checkIfThereAreProposal = async (rome) => {
    /**
     * KBA 20220105: Issue comes from address API if it's down or no result is found
     */
    if (formulaire.geo_coordonnees === "NOT FOUND") {
      setHaveProposals(false)
      return
    }

    const [latitude, longitude] = formulaire.geo_coordonnees.split(",")

    const { data } = await getRelatedEtablissementsFromRome({ rome, latitude, longitude })
    setHaveProposals(!!data.length)
  }

  useEffect(async () => {
    const { data } = await getFormulaire(id_form || params.id_form)
    setFormulaire(data)

    // Display custom address autocomplete
    if (params.id_offre) {
      const offre = data.offres.find((offre) => offre._id === params.id_offre)

      if (offre && offre.custom_adress) {
        setToggleChangeAddress(true)
      }
    }
  }, [])

  return (
    <Formik
      validateOnMount
      enableReinitialize={true}
      initialValues={{
        libelle: props.libelle ?? "",
        rome_appellation_label: props.rome_appellation_label ?? "",
        romes: props.romes ?? [],
        niveau: props.niveau ?? "",
        date_debut_apprentissage: props.date_debut_apprentissage ? dayjs(props.date_debut_apprentissage).format(DATE_FORMAT) : "",
        description: props.description ?? undefined,
        date_creation: props.date_creation ?? dayjs().format(DATE_FORMAT),
        date_expiration: props.date_expiration ?? dayjs().add(1, "month").format(DATE_FORMAT),
        statut: props.statut ?? "Active",
        type: props.type ?? ["Apprentissage"],
        multi_diffuser: props.multi_diffuser ?? undefined,
        delegate: props.delegate ?? undefined,
        rome_detail: {},
        elligible_handicap: props.elligible_handicap ?? false,
        quantite: props.quantite ?? 1,
        duree_contrat: props.duree_contrat ?? 1,
        rythme_alternance: props.rythme_alternance ?? undefined,
        custom_adress: props.custom_adress ?? undefined,
      }}
      validationSchema={Yup.object().shape({
        libelle: Yup.string().required("Champ obligatoire"),
        niveau: Yup.string().required("Champ obligatoire"),
        date_debut_apprentissage: Yup.date().required("Champ obligatoire"),
        type: Yup.array().required("Champ obligatoire"),
        multi_diffuser: Yup.boolean(),
      })}
      onSubmit={props.fromDashboard ? (values, bag) => submitFromDashboard(values, bag) : (values) => submitFromDepotRapide(values)}
    >
      {(formik) => {
        let { values, setFieldValue, handleChange, errors, touched, isValid, isSubmitting, dirty, submitForm } = formik
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Métier</FormLabel>
              <DropdownCombobox
                handleSearch={handleJobSearch}
                inputItems={inputJobItems}
                setInputItems={setInputJobItems}
                saveSelectedItem={(values) => {
                  /**
                   * validator broken when using setFieldValue : https://github.com/formium/formik/issues/2266
                   * work around until v3 : setTimeout
                   */
                  setTimeout(async () => {
                    await checkIfThereAreProposal(values.codeRome)
                    setFieldValue("libelle", values.intitule)
                    setFieldValue("rome_appellation_label", values.appellation)
                    setFieldValue("romes", [values.codeRome])
                  }, 0)

                  props.getRomeInformation(values.codeRome, values.appellation, formik)
                }}
                name="libelle"
                value={values.rome_appellation_label}
                placeholder="Rechercher un métier.."
              />
            </FormControl>
            <FormControl mt={6}>
              <FormLabel>
                <Flex alignItems="flex-end">
                  Type de contrat en alternance{" "}
                  <Link href="https://www.service-public.fr/professionnels-entreprises/vosdroits/F31704" isExternal ml={1}>
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
                  setFieldValue("type", value)
                }}
                value={values.type}
                defaultValue={["Apprentissage"]}
              >
                <Stack direction="row" spacing={5}>
                  <Checkbox value="Apprentissage">Apprentissage</Checkbox>
                  <Checkbox value="Professionnalisation">Professionnalisation</Checkbox>
                </Stack>
              </CheckboxGroup>
            </FormControl>
            <FormControl mt={6} isRequired>
              <FormLabel>Niveau visé en fin d’études</FormLabel>
              <Select variant="outline" size="md" name="niveau" defaultValue={values.niveau} onChange={handleChange}>
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
              {errors.niveau && touched.niveau && <FormErrorMessage>{errors.niveau}</FormErrorMessage>}
            </FormControl>
            <FormControl mt={6} isRequired>
              <FormLabel>Date de début</FormLabel>
              <Input type="date" name="date_debut_apprentissage" min={minDate} defaultValue={values.date_debut_apprentissage} onChange={handleChange} />
            </FormControl>
            {/* <FormControl mt={8}>
              <Box p={3} bg='beige' borderBottom='4px solid #000091'>
                <FormLabel>
                  Avez-vous déjà déposé cette offre sur une autre plateforme (Pôle Emploi, Indeed ...) ?
                </FormLabel>
                <Stack align='flex-start' spacing={5} my={5}>
                  <Button
                    leftIcon={<ThumbUp />}
                    variant='secondary'
                    isActive={values.multi_diffuser === true ? true : false}
                    onClick={() => setFieldValue('multi_diffuser', true)}
                  >
                    Oui, l'offre est également ailleurs
                  </Button>
                  <Button
                    leftIcon={<ThumbDown />}
                    variant='secondary'
                    isActive={values.multi_diffuser === false ? true : false}
                    onClick={() => setFieldValue('multi_diffuser', false)}
                  >
                    Non, l'offre est uniquement sur La bonne alternance
                  </Button>
                </Stack>
              </Box>
            </FormControl> */}
            {organisation !== "atlas" && (
              <FormControl mt={6}>
                <Checkbox name="elligible_handicap" value={values.elligible_handicap} isChecked={values.elligible_handicap} onChange={handleChange}>
                  Je souhaite faire figurer sur l’offre la mention suivante: <br />
                  "À compétences égales, une attention particulière sera apportée aux personnes en situation de handicap."
                </Checkbox>
              </FormControl>
            )}
            <FormControl mt={6}>
              <ChampNombre max={10} name="quantite" value={values.quantite} label="Nombre de poste(s) disponible(s)" handleChange={setFieldValue} />
            </FormControl>
            <FormControl mt={6}>
              <ChampNombre max={4} name="duree_contrat" value={values.duree_contrat} label="Durée du contrat (année)" handleChange={setFieldValue} />
            </FormControl>
            {auth.type !== AUTHTYPE.ENTREPRISE && (
              <FormControl mt={6}>
                <FormLabel>Rythme de l'alternance (formation / entreprise)</FormLabel>
                <FormHelperText pb={2}>Facultatif</FormHelperText>
                <Select variant="outline" size="md" name="rythme_alternance" defaultValue={values.rythme_alternance} onChange={handleChange}>
                  <option value="" hidden>
                    Choisissez un rythme
                  </option>
                  <option value="Indifférent">Indifférent</option>
                  <option value="2 jours / 3 jours">2 jours / 3 jours</option>
                  <option value="1 semaine / 1 semaine">1 semaine / 1 semaine</option>
                  <option value="2 semaines / 3 semaines">2 semaines / 3 semaines</option>
                  <option value="6 semaines / 6 semaines">6 semaines / 6 semaines</option>
                </Select>
                {errors.rythme_alternance && touched.rythme_alternance && <FormErrorMessage>{errors.rythme_alternance}</FormErrorMessage>}
              </FormControl>
            )}
            {/* <FormControl mt={6}>
              <FormLabel fontWeight="bold">Lieu d’exécution de l’emploi</FormLabel>
              <Text fontSize="16px" mt={2} mb={4}>
                Par défaut, l’adresse utilisée pour localiser l’offre est celle figurant dans les informations légales de l’entreprise.
              </Text>
              {!toggleChangeAddress ? (
                <>
                  <Text
                    variant="highlight"
                    sx={{
                      paddingTop: "8px",
                      paddingBottom: "8px",
                      marginTop: 2,
                      marginBottom: 4,
                      textTransform: "capitalize",
                      fontSize: "16px",
                    }}
                  >
                    {formulaire?.adresse}
                  </Text>
                  <Link
                    textColor="bluefrance.500"
                    onClick={() => setToggleChangeAddress(!toggleChangeAddress)}
                    sx={{
                      textDecoration: "none !important",
                      borderBottom: "solid 1px",
                      marginLeft: 1,
                    }}
                  >
                    <Pen />
                    Modifier l’adresse postale
                  </Link>
                </>
              ) : (
                <>
                  <Box mb={5}>
                    <AdresseAutocomplete
                      handleValues={(address) => {
                        setCustomAddress(address)
                        setFieldValue("custom_adress", address.name)
                      }}
                      defaultValue={values?.custom_adress || ""}
                      setFieldTouched={Function}
                      name="custom_adress"
                      required={true}
                    />
                  </Box>
                  <Link
                    textColor="bluefrance.500"
                    textDecoration="none"
                    onClick={() => setToggleChangeAddress(!toggleChangeAddress)}
                    sx={{ textDecoration: "none !important", borderBottom: "solid 1px", marginLeft: 1 }}
                  >
                    <Revert />
                    Utiliser l’adresse par défaut
                  </Link>
                </>
              )}
            </FormControl> */}
            <Divider mt={5} />
            {(values.description || organisation?.includes("akto")) && (
              <FormControl mt={6}>
                <FormLabel>Description</FormLabel>
                <Textarea rows="6" name="description" defaultValue={values.description} onChange={handleChange} />
                <FormHelperText>
                  Insérer ici une description de l'offre d'apprentissage, un lien vers la fiche de poste ou tout élément permettant de présenter le poste à pourvoir.
                </FormHelperText>
              </FormControl>
            )}
            <Flex justify="flex-end" my={8}>
              <Button variant="secondary" onClick={() => navigate(-1)} mr={4}>
                Annuler
              </Button>
              <Button leftIcon={<ArrowRightLine />} variant="form" isDisabled={!(isValid && dirty) || isSubmitting} isActive={isValid && dirty} onClick={submitForm}>
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
      <>
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
            <AccordionItem key={0}>
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
                    <ul className={style.voeux}>
                      {definitionSplitted.map((x, index) => {
                        return (
                          <li className={style.voeux} key={index}>
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
            <AccordionItem key={1}>
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
                    <ul className={style.voeux}>
                      {competencesDeBase.map((x) => (
                        <li className={style.voeux} key={x.codeRome}>
                          {x.libelle}
                        </li>
                      ))}
                    </ul>
                  </AccordionPanel>
                </>
              )}
            </AccordionItem>
            <hr />
            <AccordionItem key={1}>
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
      </>
    )
  } else {
    return (
      <>
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
              <LbaCandidat height="100px" width="150px" />
              <J1S w="100px" h="100px" />
              <Parcoursup w="220px" h="100px" />
            </Stack>
          </Box>
        </Box>
      </>
    )
  }
}

export default (props) => {
  const [romeInformation, setRomeInformation] = useState({})
  const [loading, setLoading] = useState(false)
  const { widget } = useContext(WidgetContext)

  const getRomeInformation = (rome, appellation, formik) => {
    getRomeDetail(rome)
      .then((result) => {
        setLoading(true)
        formik.setFieldValue("rome_detail", result.data)
        setRomeInformation({ appellation, ...result.data })
      })
      .catch((error) => console.log(error))
      .finally(() => {
        setTimeout(() => {
          setLoading(false)
        }, 700)
      })
  }

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
          <AjouterVoeux {...props} getRomeInformation={getRomeInformation} />
        </Box>
      </Box>
      <Box>
        {loading ? (
          <Flex h="100%" justify="center" align="center" direction="column">
            <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
            <Text>Recherche en cours...</Text>
          </Flex>
        ) : (
          <RomeInformationDetail {...romeInformation} />
        )}
      </Box>
    </SimpleGrid>
  )
}
