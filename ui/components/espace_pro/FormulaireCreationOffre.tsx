import {
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
import { IAppellationsRomes, IRecruiterJson, IReferentielRomeForJob } from "shared"
import { TRAINING_CONTRACT_TYPE, TRAINING_RYTHM } from "shared/constants/recruteur"
import { IJobJson, JOB_STATUS } from "shared/models/job.model"
import * as Yup from "yup"

import { AUTHTYPE } from "@/common/contants"
import { debounce } from "@/common/utils/debounce"
import { InfosDiffusionOffre } from "@/components/DepotOffre/InfosDiffusionOffre"
import { RomeDetailWithQuery } from "@/components/DepotOffre/RomeDetailWithQuery"
import { LogoContext } from "@/context/contextLogo"
import { WidgetContext } from "@/context/contextWidget"
import { useAuth } from "@/context/UserContext"
import { ArrowRightLine, ExternalLinkLine, Minus, Plus, Warning } from "@/theme/components/icons"
import { createOffre, createOffreByToken, getFormulaire, getFormulaireByToken, getRelatedEtablissementsFromRome, getRomeDetail } from "@/utils/api"
import { apiGet } from "@/utils/api.utils"

import CustomInput from "./CustomInput"
import DropdownCombobox from "./DropdownCombobox"

const ISO_DATE_FORMAT = "YYYY-MM-DD"
const FR_DATE_FORMAT = "DD/MM/YYYY"

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

const FormikCreationOffre = ({
  offre,
  onSubmit,
  onRomeChange,
  competencesDirty,
}: {
  offre?: IJobJson
  onSubmit: (values: IJobJson, bag: any) => void
  onRomeChange: (rome: string, appellation: string) => void
  competencesDirty: boolean
}) => {
  const router = useRouter()
  const { user } = useAuth()
  const { organisation } = useContext(LogoContext)

  const { type } = router.query as { establishment_id: string; email: string; userId: string; type: string; token: string }

  const handleJobSearch = async (search: string) => {
    if (search.trim().length !== 0) {
      try {
        const result = (await apiGet(`/v1/metiers/intitule`, { querystring: { label: search } })) as IAppellationsRomes
        return result.coupleAppellationRomeMetier
      } catch (error) {
        throw new Error(error)
      }
    }
    return []
  }

  const minStartDate = dayjs().startOf("day")
  const maxStartDate = dayjs().add(2, "years")

  return (
    <Formik
      validateOnMount
      enableReinitialize={true}
      initialValues={{
        rome_label: offre?.rome_label ?? "",
        rome_appellation_label: offre?.rome_appellation_label ?? "",
        rome_code: offre?.rome_code ?? [],
        job_level_label: offre?.job_level_label ?? "Indifférent",
        job_start_date: offre?.job_start_date ? dayjs(offre.job_start_date).format(ISO_DATE_FORMAT) : "",
        job_description: offre?.job_description ?? undefined,
        job_creation_date: offre?.job_creation_date ?? dayjs().format(ISO_DATE_FORMAT),
        job_expiration_date: offre?.job_expiration_date ?? dayjs().add(2, "month").format(ISO_DATE_FORMAT),
        job_status: offre?.job_status ?? JOB_STATUS.ACTIVE,
        job_type: offre?.job_type ?? ["Apprentissage"],
        delegations: offre?.delegations ?? undefined,
        is_disabled_elligible: offre?.is_disabled_elligible ?? false,
        job_count: offre?.job_count ?? 1,
        job_duration: offre?.job_duration ?? 12,
        job_rythm: offre?.job_rythm ?? null,
        job_delegation_count: offre?.job_delegation_count ?? 0,
      }}
      validationSchema={Yup.object().shape({
        rome_label: Yup.string().required("Champ obligatoire"),
        job_level_label: Yup.string().required("Champ obligatoire"),
        job_start_date: Yup.date()
          .min(minStartDate, `La date de début doit être après le ${minStartDate.format(FR_DATE_FORMAT)}`)
          .max(maxStartDate, `La date de début doit être avant le ${maxStartDate.format(FR_DATE_FORMAT)}`)
          .required("Champ obligatoire"),
        job_type: Yup.array().required("Champ obligatoire"),
        job_duration: Yup.number().max(36, "Durée maximale du contrat : 36 mois").min(6, "Durée minimale du contrat : 6 mois").typeError("Durée minimale du contrat : 6 mois"),
      })}
      onSubmit={(values: any, bag) => onSubmit(values, bag)}
    >
      {(formik) => {
        const { values, setFieldValue, handleChange, errors, touched, isValid, isSubmitting, dirty, submitForm } = formik
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Métier</FormLabel>
              <DropdownCombobox
                handleSearch={debounce(handleJobSearch, 300)}
                saveSelectedItem={(values: IAppellationsRomes["coupleAppellationRomeMetier"][number]) => {
                  /**
                   * validator broken when using setFieldValue : https://github.com/formium/formik/issues/2266
                   * work around until v3 : setTimeout
                   */
                  setTimeout(async () => {
                    setFieldValue("rome_label", values.intitule)
                    setFieldValue("rome_appellation_label", values.appellation)
                    setFieldValue("rome_code", [values.codeRome])
                    onRomeChange(values.codeRome, values.appellation)
                  }, 0)
                }}
                name="rome_label"
                value={values.rome_appellation_label}
                placeholder="Rechercher un métier.."
                dataTestId="offre-metier"
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
                <option value="Indifférent">Indifférent</option>
                <option value="Cap, autres formations niveau (Infrabac)">Cap, autres formations niveau (Infrabac)</option>
                <option value="BP, Bac, autres formations niveau (Bac)">BP, Bac, autres formations niveau (Bac)</option>
                <option value="BTS, DEUST, autres formations niveau (Bac+2)">BTS, DEUST, autres formations niveau (Bac+2)</option>
                <option value="Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)">Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)</option>
                <option value="Master, titre ingénieur, autres formations niveau (Bac+5)">Master, titre ingénieur, autres formations niveau (Bac+5)</option>
              </Select>
              {errors.job_level_label && touched.job_level_label && <FormErrorMessage>{errors.job_level_label as string}</FormErrorMessage>}
            </FormControl>
            <Box mt={6}>
              <CustomInput
                required={true}
                name="job_start_date"
                label="Date de début"
                type="date"
                value={values.job_start_date}
                min={minStartDate.format(ISO_DATE_FORMAT)}
                max={maxStartDate.format(ISO_DATE_FORMAT)}
              />
            </Box>
            {organisation !== "atlas" && (
              <FormControl mt={6}>
                <Checkbox name="is_disabled_elligible" isChecked={values.is_disabled_elligible} onChange={handleChange}>
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
                isDisabled={!(isValid && (dirty || competencesDirty)) || isSubmitting}
                isActive={isValid && (dirty || competencesDirty)}
                onClick={submitForm}
                data-testid="creer-offre"
              >
                {offre?._id ? "Mettre à jour" : "Créer l'offre"}
              </Button>
            </Flex>
          </>
        )
      }}
    </Formik>
  )
}

export const FormulaireCreationOffre = ({
  fromDashboard,
  offre,
  handleSave,
}: {
  fromDashboard?: boolean
  offre?: IJobJson
  handleSave?: (values: any) => Promise<{ form?: IRecruiterJson; offre?: IJobJson }>
}) => {
  const { rome_appellation_label, rome_code } = offre ?? {}
  const initRome = rome_code?.at(0)
  const [romeAndAppellation, setRomeAndAppellation] = useState<{ rome: string; appellation: string }>(
    rome_appellation_label && initRome ? { rome: initRome, appellation: rome_appellation_label } : null
  )
  const { rome } = romeAndAppellation ?? {}
  const { user } = useAuth()
  const { widget } = useContext(WidgetContext)
  const router = useRouter()
  const { establishment_id, email, userId, token } = router.query as { establishment_id: string; email: string; userId: string; type: string; token: string }

  const { data: formulaire } = useQuery("offre-liste", {
    enabled: Boolean(establishment_id),
    queryFn: () => (token ? getFormulaireByToken(establishment_id, token) : getFormulaire(establishment_id)),
  })
  const romeQuery = useQuery(["getRomeDetail", rome], () => getRomeDetail(rome), {
    retry: false,
    enabled: Boolean(rome),
  })

  const { geo_coordinates } = formulaire ?? {}
  const [latitude, longitude] = geo_coordinates?.split(",")?.map((str) => parseFloat(str)) ?? []
  const relatedEtablissementQuery = useQuery(["relatedEtablissement", rome, latitude, longitude], () => getRelatedEtablissementsFromRome({ rome, latitude, longitude, limit: 1 }), {
    retry: false,
    enabled: Boolean(rome && latitude && longitude),
  })

  const haveProposals = Boolean(relatedEtablissementQuery.data?.length)

  const {
    widget: { isWidget },
  } = useContext(WidgetContext)

  // eslint-disable-next-line prefer-const
  let [selectedCompetences, setSelectedCompetences] = useState<IReferentielRomeForJob["competences"] | null>(offre?.competences_rome ?? null)
  const [competencesDirty, setCompetencesDirty] = useState(false)

  const onRomeChange = (rome: string, appellation: string) => {
    setRomeAndAppellation({ rome, appellation })
    setSelectedCompetences(null)
    setCompetencesDirty(true)
  }

  const onSelectedCompetencesChange = (selectedCompetences: Record<string, string[]>) => {
    if (!romeQuery.data) {
      throw new Error("inattendu : pas de données ROME")
    }
    const { competences } = romeQuery.data as IReferentielRomeForJob
    const isSelected = (groupKey: string, competence: string): boolean => (selectedCompetences[groupKey] ?? []).includes(competence)

    const savedCompetences: IReferentielRomeForJob["competences"] = {
      savoir_etre_professionnel: competences.savoir_etre_professionnel.filter((x) => isSelected("savoir_etre_professionnel", x.libelle)),
      savoir_faire: competences.savoir_faire.flatMap((competencesGroup) => {
        const selectedItems = (competencesGroup?.items ?? []).filter(({ libelle }) => isSelected("savoir_faire", libelle))
        if (!selectedItems.length) {
          return []
        }
        return [{ ...competencesGroup, items: selectedItems }]
      }),
      savoirs: competences.savoirs.flatMap((competencesGroup) => {
        const selectedItems = (competencesGroup?.items ?? []).filter(({ libelle }) => isSelected("savoirs", libelle))
        if (!selectedItems.length) {
          return []
        }
        return [{ ...competencesGroup, items: selectedItems }]
      }),
    }
    setSelectedCompetences(savedCompetences)
    setCompetencesDirty(true)
  }

  if (!establishment_id) return <></>

  /**
   * @description Submits form from in a connected context.
   * @param values
   * @param resetForm
   * @return {Promise<void>}
   */
  const submitFromDashboard = async (values, { resetForm }) => {
    if (user && user.type !== AUTHTYPE.ENTREPRISE) {
      await handleSave(values)
    } else {
      const res = await handleSave(values)

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
   * @description Handles redirection after submit.
   * @param {Object} form - Formulaire
   * @param {Object} offre - Offre
   * @param {boolean} fromDashboard - Becomes from connected interface or anonymous.
   * @return {void}
   */
  const handleRedirectionAfterSubmit = (form: IRecruiterJson, job: IJobJson, fromDashboard: boolean, jobToken: string) => {
    if (haveProposals) {
      return router.replace({
        pathname: isWidget ? "/espace-pro/widget/entreprise/mise-en-relation" : "/espace-pro/creation/mise-en-relation",
        query: { job: JSON.stringify(omit(job, "rome_detail")), email, geo_coordinates: form.geo_coordinates, fromDashboard, userId, establishment_id, token: jobToken },
      })
    }

    router.replace({
      pathname: isWidget ? "/espace-pro/widget/entreprise/fin" : "/espace-pro/creation/fin",
      query: { jobId: job._id.toString(), email, withDelegation: false, fromDashboard, userId, establishment_id, token: jobToken },
    })
  }

  const finalSelectedCompetences = selectedCompetences ?? romeQuery?.data?.competences

  const onSubmit = (values, bag) => {
    values = { ...values, competences_rome: finalSelectedCompetences }
    fromDashboard ? submitFromDashboard(values, bag) : submitFromDepotRapide(values)
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
          <FormikCreationOffre onRomeChange={onRomeChange} onSubmit={onSubmit} offre={offre} competencesDirty={competencesDirty} />
        </Box>
      </Box>
      <Box>
        {romeAndAppellation ? (
          <RomeDetailWithQuery
            selectedCompetences={{
              savoirs: (finalSelectedCompetences?.savoirs ?? []).flatMap(({ items = [] }) => items.map((item) => item?.libelle)),
              savoir_etre_professionnel: (finalSelectedCompetences?.savoir_etre_professionnel ?? []).flatMap(({ libelle }) => (libelle ? [libelle] : [])),
              savoir_faire: (finalSelectedCompetences?.savoir_faire ?? []).flatMap(({ items = [] }) => items.map((item) => item?.libelle)),
            }}
            appellation={romeAndAppellation.appellation}
            rome={romeAndAppellation.rome}
            onChange={onSelectedCompetencesChange}
          />
        ) : (
          <InfosDiffusionOffre />
        )}
      </Box>
    </SimpleGrid>
  )
}

export default FormulaireCreationOffre
