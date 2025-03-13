"use client"

import { Box, Grid, Heading } from "@chakra-ui/react"
import dayjs from "dayjs"
import { Formik } from "formik"
import { useRouter } from "next/navigation"
import { useContext, useState } from "react"
import { useQuery } from "react-query"
import { IRecruiterJson, IReferentielRomeForJob } from "shared"
import { IJobJson, JOB_STATUS } from "shared/models/job.model"
import { detectUrlAndEmails } from "shared/utils/detectUrlAndEmails"
import * as Yup from "yup"

import { FormulaireEditionOffreButtons } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreButtons"
import { FormulaireEditionOffreFields } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreFields"
import { AUTHTYPE } from "@/common/contants"
import { InfosDiffusionOffre } from "@/components/DepotOffre/InfosDiffusionOffre"
import { RomeDetailWithQuery } from "@/components/DepotOffre/RomeDetailWithQuery"
import { WidgetContext } from "@/context/contextWidget"
import { useAuth } from "@/context/UserContext"
import { createOffre, createOffreByToken, getRomeDetail } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

const ISO_DATE_FORMAT = "YYYY-MM-DD"
const FR_DATE_FORMAT = "DD/MM/YYYY"

export const FormulaireEditionOffre = ({
  fromDashboard,
  offre,
  establishment_id,
  user_id,
  handleSave,
}: {
  fromDashboard?: boolean
  offre?: IJobJson
  establishment_id: string
  user_id: string
  handleSave?: (values: any) => Promise<{ form?: IRecruiterJson; offre?: IJobJson }>
}) => {
  const { rome_appellation_label, rome_code } = offre ?? {}
  const initRome = rome_code?.at(0)
  const [romeAndAppellation, setRomeAndAppellation] = useState<{ rome: string; appellation: string }>(
    rome_appellation_label && initRome ? { rome: initRome, appellation: rome_appellation_label } : null
  )
  const { rome } = romeAndAppellation ?? {}
  const { user } = useAuth()
  const router = useRouter()
  const { email, token } = useSearchParamsRecord() as { establishment_id: string; email: string; userId: string; type: string; token: string }

  const romeQuery = useQuery(["getRomeDetail", rome], () => getRomeDetail(rome), {
    retry: false,
    enabled: Boolean(rome),
  })

  const {
    widget: { isWidget },
  } = useContext(WidgetContext)

  const [selectedCompetences, setSelectedCompetences] = useState<IReferentielRomeForJob["competences"] | null>(offre?.competences_rome ?? null)
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

  const handleRedirectionAfterSubmit = (form: IRecruiterJson, job: IJobJson, fromDashboard: boolean, jobToken: string) => {
    router.replace(
      PAGES.dynamic
        .espaceProCreationFin({
          jobId: job._id.toString(),
          email,
          withDelegation: false,
          fromDashboard,
          userId: user_id,
          token: jobToken ?? undefined,
          isWidget,
        })
        .getPath()
    )
  }

  const finalSelectedCompetences = selectedCompetences ?? romeQuery?.data?.competences

  const onSubmit = (values, bag) => {
    values = { ...values, competences_rome: finalSelectedCompetences, offer_title_custom: values.offer_title_custom || null }
    fromDashboard ? submitFromDashboard(values, bag) : submitFromDepotRapide(values)
  }

  const minStartDate = dayjs().startOf("day")
  const maxStartDate = dayjs().add(2, "years")

  return (
    <>
      <Formik
        validateOnMount
        enableReinitialize={true}
        initialValues={{
          rome_label: offre?.rome_label ?? "",
          rome_appellation_label: offre?.rome_appellation_label ?? "",
          rome_code: offre?.rome_code ?? [],
          job_level_label: offre?.job_level_label ?? "Indifférent",
          job_start_date: offre?.job_start_date ? dayjs(offre.job_start_date).format(ISO_DATE_FORMAT) : "",
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
          offer_title_custom: offre?.offer_title_custom ?? "",
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
          offer_title_custom: Yup.string()
            .min(3, "L’intitulé est trop court. Sa taille doit être comprise entre 3 et 150 caractères.")
            .max(150, "L’intitulé est trop long. Sa taille doit être comprise entre 3 et 150 caractères.")
            .test("no-urls-emails", "Les urls et les emails sont interdits", (value) => !value || detectUrlAndEmails(value).length === 0),
        })}
        onSubmit={(values: any, bag) => onSubmit(values, bag)}
      >
        {({ values }) => (
          <Grid
            gridTemplateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)", "repeat(2, 1fr)"]}
            gridTemplateRows={["repeat(3, auto)", "repeat(3, auto)", "auto 1fr", "auto 1fr"]}
            rowGap={4}
            columnGap={4}
          >
            <Box>
              <Heading className="big">Votre offre</Heading>
              <Box mt={4}>
                <FormulaireEditionOffreFields onRomeChange={onRomeChange} />
              </Box>
            </Box>
            <Box gridColumnStart={[1, 1, 2, 2]} gridRow={["2 / 3", "2 / 3", "1 / 3", "1 / 3"]}>
              {romeAndAppellation ? (
                <RomeDetailWithQuery
                  selectedCompetences={{
                    savoirs: (finalSelectedCompetences?.savoirs ?? []).flatMap(({ items = [] }) => items.map((item) => item?.libelle)),
                    savoir_etre_professionnel: (finalSelectedCompetences?.savoir_etre_professionnel ?? []).flatMap(({ libelle }) => (libelle ? [libelle] : [])),
                    savoir_faire: (finalSelectedCompetences?.savoir_faire ?? []).flatMap(({ items = [] }) => items.map((item) => item?.libelle)),
                  }}
                  title={values.offer_title_custom || romeAndAppellation.appellation}
                  rome={romeAndAppellation.rome}
                  onChange={onSelectedCompetencesChange}
                />
              ) : (
                <Box display={["none", "block"]}>
                  <InfosDiffusionOffre />
                </Box>
              )}
            </Box>
            <Box mt={8}>
              <FormulaireEditionOffreButtons offre={offre} competencesDirty={competencesDirty} />
            </Box>
          </Grid>
        )}
      </Formik>
    </>
  )
}
