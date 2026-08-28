"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import { Box, CircularProgress, Typography } from "@mui/material"
import { captureException } from "@sentry/nextjs"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { Formik, useFormikContext } from "formik"
import { useState } from "react"
import type { IJob, IReferentielRomeForJob } from "shared"
import { JOB_DESCRIPTION_MAX_LENGTH, JOB_EMPLOYER_DESCRIPTION_MAX_LENGTH, JOB_START_TYPE, JOB_STATUS } from "shared/models/job.model"
import { detectUrlAndEmails, detectUrls } from "shared/utils/detect-url-and-emails"
import * as Yup from "yup"
import { InfosDiffusionOffre } from "@/components/DepotOffre/InfosDiffusionOffre"
import type { RomeCompetenceKey } from "@/components/DepotOffre/RomeDetail"
import { RomeDetailWithQuery } from "@/components/DepotOffre/RomeDetailWithQuery"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { ameliorerTexteOffre, getRomeDetail } from "@/utils/api"
import { FormulaireEditionOffreButtons } from "./FormulaireEditionOffreButtons"
import { FormulaireEditionOffreFields } from "./FormulaireEditionOffreFields"

const ISO_DATE_FORMAT = "YYYY-MM-DD"
const FR_DATE_FORMAT = "DD/MM/YYYY"
const EMPLOYER_DESCRIPTION_MAX = JOB_EMPLOYER_DESCRIPTION_MAX_LENGTH
const JOB_DESCRIPTION_MAX = JOB_DESCRIPTION_MAX_LENGTH
const AMELIORER_IA_MAX_USAGES = 2

type FreeTextFieldName = "job_description" | "job_employer_description"

const AmeliorerIaButton = ({ fieldName, establishmentId }: { fieldName: FreeTextFieldName; establishmentId?: string }) => {
  const { values, setFieldValue } = useFormikContext<any>()
  const [remaining, setRemaining] = useState(AMELIORER_IA_MAX_USAGES)
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const text: string = values[fieldName] ?? ""

  const handleClick = async () => {
    if (!establishmentId || loading || remaining <= 0 || !text.trim()) return
    setLoading(true)
    setHasError(false)
    try {
      const result = await ameliorerTexteOffre(establishmentId, fieldName, text)
      if (result && "text" in result && result.text) {
        setFieldValue(fieldName, result.text)
        setRemaining((r) => r - 1)
      } else {
        setHasError(true)
      }
    } catch (error) {
      // Échec de l'appel IA (timeout, erreur API) : le recruteur peut poursuivre son dépôt sans blocage,
      // mais doit être informé que rien n'a changé (sinon le clic paraît sans effet).
      captureException(error)
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        borderBottom: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        px: fr.spacing("3v"),
        py: fr.spacing("2v"),
      }}
    >
      <Typography sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>
        {hasError
          ? "L'amélioration a échoué, veuillez réessayer."
          : `Notre IA peut améliorer votre texte jusqu'à ${AMELIORER_IA_MAX_USAGES} fois (orthographe, structure, formulation)`}
      </Typography>
      <Button
        type="button"
        priority="tertiary"
        size="small"
        iconId="ri-magic-line"
        iconPosition="left"
        disabled={!establishmentId || loading || remaining <= 0 || !text.trim()}
        onClick={handleClick}
      >
        {loading ? (
          <>
            <CircularProgress size={14} sx={{ mr: fr.spacing("2v"), verticalAlign: "middle" }} />
            Amélioration en cours…
          </>
        ) : (
          `Améliorer (${remaining}/${AMELIORER_IA_MAX_USAGES})`
        )}
      </Button>
    </Box>
  )
}

type DescriptionMode = "structured" | "custom"

const DescriptionModeToggle = ({ mode, onChange }: { mode: DescriptionMode; onChange: (mode: DescriptionMode) => void }) => (
  <RadioButtons
    style={{ marginBottom: 0 }}
    legend="Mode de rédaction"
    name="description_mode"
    options={[
      {
        label: "Utiliser la description du métier",
        hintText: "Description générée à partir de la fiche métier, personnalisable via les compétences.",
        nativeInputProps: {
          checked: mode === "structured",
          onChange: () => onChange("structured"),
        },
      },
      {
        label: "Personnaliser la description",
        hintText: "Rédigez vous-même la description du poste.",
        nativeInputProps: {
          checked: mode === "custom",
          onChange: () => onChange("custom"),
        },
      },
    ]}
  />
)

const JobDescriptionField = ({ establishmentId }: { establishmentId?: string }) => {
  const { values, setFieldValue, errors } = useFormikContext<any>()
  return (
    <Box sx={{ mt: fr.spacing("4v"), "& .fr-input-group": { mb: 0 } }}>
      <label className={fr.cx("fr-label")} htmlFor="job_description">
        Description du poste
        <span className={fr.cx("fr-hint-text")}>
          Décrivez les missions et responsabilités du poste. Les coordonnées, adresses e-mails et liens externes ne seront pas affichés aux candidats. La taille du champ est
          limitée à {JOB_DESCRIPTION_MAX} caractères.
        </span>
      </label>
      <AmeliorerIaButton fieldName="job_description" establishmentId={establishmentId} />
      <Input
        label=""
        state={errors.job_description ? "error" : "default"}
        stateRelatedMessage={errors.job_description as string}
        textArea
        nativeTextAreaProps={{
          id: "job_description",
          name: "job_description",
          value: values.job_description,
          maxLength: JOB_DESCRIPTION_MAX,
          rows: 8,
          style: { resize: "none" },
          onChange: (e) => setFieldValue("job_description", e.target.value),
        }}
      />
    </Box>
  )
}

const EmployerDescriptionField = ({ establishmentId }: { establishmentId?: string }) => {
  const { values, setFieldValue, errors } = useFormikContext<any>()
  return (
    <Box sx={{ "& .fr-input-group": { mb: 0 } }}>
      <label className={fr.cx("fr-label")} htmlFor="job_employer_description">
        Présentation de l'entreprise (Facultatif)
        <span className={fr.cx("fr-hint-text")}>
          Décrivez les activités et les spécificités de l'entreprise. Les coordonnées, adresses e-mails et liens externes ne seront pas affichés aux candidats. La taille du champ
          est limitée à {EMPLOYER_DESCRIPTION_MAX} caractères.
        </span>
      </label>
      <AmeliorerIaButton fieldName="job_employer_description" establishmentId={establishmentId} />
      <Input
        label=""
        state={errors.job_employer_description ? "error" : "default"}
        stateRelatedMessage={errors.job_employer_description as string}
        textArea
        nativeTextAreaProps={{
          id: "job_employer_description",
          name: "job_employer_description",
          value: values.job_employer_description,
          maxLength: EMPLOYER_DESCRIPTION_MAX,
          rows: 6,
          placeholder: "Saisissez votre texte ici",
          style: { resize: "none" },
          onChange: (e) => setFieldValue("job_employer_description", e.target.value),
        }}
      />
    </Box>
  )
}

export const FormulaireEditionOffreStep1 = ({
  offre,
  establishment_id,
  onSubmit,
  formValues,
}: {
  offre?: IJob
  establishment_id?: string
  onSubmit?: (values: any) => void
  formValues: any
}) => {
  const { rome_appellation_label, rome_code } = offre ?? {}
  const initRome = rome_code?.at(0)
  const [romeAndAppellation, setRomeAndAppellation] = useState<{ rome: string; appellation: string } | null>(
    rome_appellation_label && initRome ? { rome: initRome, appellation: rome_appellation_label } : null
  )
  const { rome } = romeAndAppellation ?? {}

  const romeQuery = useQuery({
    queryKey: ["getRomeDetail", rome],
    queryFn: () => getRomeDetail(rome) as Promise<IReferentielRomeForJob>,
    retry: false,
    enabled: Boolean(rome),
  })

  const [selectedCompetences, setSelectedCompetences] = useState<IReferentielRomeForJob["competences"] | null>(offre?.competences_rome ?? formValues?.competences_rome ?? null)
  const [descriptionMode, setDescriptionMode] = useState<DescriptionMode>(offre?.job_description || formValues?.job_description ? "custom" : "structured")

  const onRomeChange = (rome: string, appellation: string) => {
    setRomeAndAppellation({ rome, appellation })
    setSelectedCompetences(null)
  }

  const onSelectedCompetencesChange = (selectedCompetences: Record<RomeCompetenceKey, Set<string>>) => {
    if (!romeQuery.data) {
      throw new Error("inattendu : pas de données ROME")
    }
    const { competences } = romeQuery.data as IReferentielRomeForJob
    const isSelected = (groupKey: string, competence: string): boolean => selectedCompetences[groupKey].has(competence)

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
  }

  if (!establishment_id) return <></>

  const finalSelectedCompetences = selectedCompetences ?? romeQuery?.data?.competences

  const localOnSubmit = (values) => {
    const isPreciseDate = values.job_start_type === JOB_START_TYPE.PRECISE_DATE
    values = {
      ...values,
      job_start_date_flexible: isPreciseDate ? Boolean(values.job_start_date_flexible) : false,
      competences_rome: finalSelectedCompetences,
      offer_title_custom: values.offer_title_custom || null,
      job_employer_description: values.job_employer_description || null,
      job_description: descriptionMode === "custom" ? values.job_description?.trim() || null : null,
    }
    onSubmit?.(values)
  }

  const minStartDate = dayjs().startOf("day")
  const maxStartDate = dayjs().add(2, "years")
  let jobStartDateYup = Yup.date()
  if (!offre) {
    jobStartDateYup = jobStartDateYup.min(minStartDate, `La date de début doit être après le ${minStartDate.format(FR_DATE_FORMAT)}`)
  }
  jobStartDateYup = jobStartDateYup.max(maxStartDate, `La date de début doit être avant le ${maxStartDate.format(FR_DATE_FORMAT)}`).required("Champ obligatoire")

  const initialValues = {
    rome_label: offre?.rome_label ?? "",
    rome_appellation_label: offre?.rome_appellation_label ?? "",
    rome_code: offre?.rome_code ?? [],
    job_level_label: offre?.job_level_label ?? "",
    job_start_type: offre?.job_start_type ?? (offre ? JOB_START_TYPE.PRECISE_DATE : ""),
    job_start_date_flexible: offre?.job_start_date_flexible ?? false,
    job_start_date: offre?.job_start_date ? dayjs(offre.job_start_date).format(ISO_DATE_FORMAT) : "",
    job_creation_date: offre?.job_creation_date ?? dayjs().format(ISO_DATE_FORMAT),
    job_expiration_date: offre?.job_expiration_date ?? dayjs().add(2, "month").format(ISO_DATE_FORMAT),
    job_status: offre?.job_status ?? JOB_STATUS.ACTIVE,
    job_type: offre?.job_type ?? ["Apprentissage"],
    delegations: offre?.delegations ?? undefined,
    job_count: offre?.job_count ?? 1,
    job_duration: offre?.job_duration ?? 12,
    job_rythm: offre?.job_rythm ?? "",
    offer_title_custom: offre?.offer_title_custom ?? "",
    job_employer_description: offre?.job_employer_description ?? "",
    job_description: offre?.job_description ?? "",
    ...formValues,
  }
  initialValues.offer_title_custom = initialValues.offer_title_custom ?? ""

  return (
    <>
      <Formik
        validateOnMount
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          rome_label: Yup.string().required("Champ obligatoire"),
          job_level_label: Yup.string().required("Champ obligatoire"),
          job_start_type: Yup.mixed<JOB_START_TYPE>().oneOf([JOB_START_TYPE.DES_QUE_POSSIBLE, JOB_START_TYPE.PRECISE_DATE], "Champ obligatoire").required("Champ obligatoire"),
          job_start_date_flexible: Yup.boolean().default(false),
          job_start_date: jobStartDateYup,
          job_type: Yup.array().required("Champ obligatoire"),
          job_rythm: Yup.string()
            .max(100)
            .test("no-url", "Les urls sont interdites", (value) => !value || !value.split(/\s+/).some((token) => token && detectUrls(token).length > 0)),
          job_duration: Yup.number().max(36, "Durée maximale du contrat : 36 mois").min(6, "Durée minimale du contrat : 6 mois").required("Durée minimale du contrat : 6 mois"),
          offer_title_custom: Yup.string()
            .trim()
            .min(3, "L'intitulé est trop court. Sa taille doit être comprise entre 3 et 150 caractères.")
            .max(150, "L'intitulé est trop long. Sa taille doit être comprise entre 3 et 150 caractères.")
            .test("no-urls-emails", "Les urls et les emails sont interdits", (value) => !value || detectUrlAndEmails(value).length === 0),
          job_employer_description: Yup.string()
            .trim()
            .transform((v) => v || undefined)
            .min(30, "La présentation est trop courte (minimum 30 caractères).")
            .max(EMPLOYER_DESCRIPTION_MAX, `La présentation est trop longue (maximum ${EMPLOYER_DESCRIPTION_MAX} caractères).`),
          job_description: Yup.string()
            .trim()
            .transform((v) => v || undefined)
            .test("required-if-custom", "Champ obligatoire", (value) => descriptionMode !== "custom" || Boolean(value))
            .test("min-if-custom", "La description est trop courte (minimum 30 caractères).", (value) => descriptionMode !== "custom" || !value || value.length >= 30)
            .test(
              "max-if-custom",
              `La description est trop longue (maximum ${JOB_DESCRIPTION_MAX} caractères).`,
              (value) => descriptionMode !== "custom" || !value || value.length <= JOB_DESCRIPTION_MAX
            ),
        })}
        onSubmit={(values: any) => localOnSubmit(values)}
      >
        {({ values }) => {
          return (
            <div>
              <Typography
                component="h1"
                sx={(theme) => ({
                  fontWeight: 700,
                  color: "#000091",
                  mb: fr.spacing("6v"),
                  [theme.breakpoints.up("xs")]: {
                    fontSize: "18px !important",
                    lineHeight: "24px !important",
                  },
                  [theme.breakpoints.up("md")]: {
                    fontSize: "20px !important",
                    lineHeight: "28px !important",
                  },
                })}
              >
                Étape 1 : Description de l'offre
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontSize: { xs: "22px !important", md: "32px !important" },
                  lineHeight: { xs: "28px !important", md: "40px !important" },
                  mb: fr.spacing("6v"),
                  fontWeight: 700,
                }}
              >
                Votre offre
              </Typography>
              <Typography component="h6" sx={{ fontSize: "0.875rem", my: fr.spacing("4v"), color: fr.colors.decisions.text.default.grey.default }}>
                Tous les champs sont obligatoires, sauf mention contraire "Facultatif".
              </Typography>
              <Box
                sx={{
                  rowGap: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
                  columnGap: fr.spacing("8v"),
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.4fr 2fr" },
                  gridTemplateRows: { xs: "auto", md: "1fr auto" },
                }}
              >
                {/* Colonne gauche : Le contrat */}
                <Box
                  sx={{
                    gridRow: { md: "1 / 3" },
                    borderRadius: fr.spacing("1v"),
                  }}
                >
                  <Box
                    sx={{
                      padding: { xs: fr.spacing("4v"), md: fr.spacing("6v") },
                      backgroundColor: fr.colors.decisions.background.alt.grey.default,
                      border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                    }}
                  >
                    <Typography component="h2" sx={{ fontWeight: 700 }}>
                      Le contrat
                    </Typography>
                    <Box sx={{ mt: fr.spacing("4v") }}>
                      <FormulaireEditionOffreFields section="contract" />
                    </Box>
                  </Box>
                </Box>

                {/* Colonne droite : présentation + description de l'offre + Rome/InfosDiffusion */}
                <Box>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: fr.spacing("2v"), mb: fr.spacing("3v") }}>
                    <Typography
                      className={`ri-information-line ${fr.cx("fr-icon--sm")}`}
                      sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.active.blueFrance.default, flexShrink: 0 }}
                    />
                    <Typography sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.active.blueFrance.default }}>
                      Notre équipe modère les contenus. Toute description non conforme à la réglementation pourra entrainer la suppression de l'offre, la désactivation du compte et
                      faire l'objet d'un signalement aux autorités compétentes.
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
                      p: fr.spacing("3v"),
                      mb: fr.spacing("4v"),
                      display: "flex",
                      gap: fr.spacing("3v"),
                      alignItems: "center",
                    }}
                  >
                    <Typography className={`ri-certificate-line ${fr.cx("fr-icon--sm")}`} sx={{ color: fr.colors.decisions.text.active.blueFrance.default, flexShrink: 0 }} />
                    <Box>
                      <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, mb: fr.spacing("1v") }}>Comment bien rédiger votre offre ?</Typography>
                      <Typography sx={{ fontSize: "0.8125rem" }}>
                        Consultez notre charte pour une offre rapidement acceptée et publiée.{" "}
                        <DsfrLink href="/guide/rediger-son-offre-d-alternance?source=guide-recruteur" size="sm">
                          Découvrir la charte
                        </DsfrLink>
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ color: fr.colors.decisions.artwork.major.blueFrance.default }}>
                    La présentation de l'entreprise
                  </Typography>
                  <Box sx={{ mt: fr.spacing("4v") }}>
                    <EmployerDescriptionField establishmentId={establishment_id} />
                  </Box>

                  <Typography variant="h4" sx={{ color: fr.colors.decisions.artwork.major.blueFrance.default, mt: fr.spacing("8v") }}>
                    La description du poste
                  </Typography>
                  <Box sx={{ mt: fr.spacing("4v") }}>
                    <FormulaireEditionOffreFields section="offer" onRomeChange={onRomeChange} />
                  </Box>

                  {romeAndAppellation && (
                    <Box sx={{ mt: fr.spacing("6v") }}>
                      <DescriptionModeToggle mode={descriptionMode} onChange={setDescriptionMode} />
                      {descriptionMode === "custom" && <JobDescriptionField establishmentId={establishment_id} />}
                    </Box>
                  )}

                  <Box sx={{ mt: fr.spacing("4v") }}>
                    {romeAndAppellation ? (
                      <RomeDetailWithQuery
                        selectedCompetences={{
                          savoirs: new Set((finalSelectedCompetences?.savoirs ?? []).flatMap(({ items = [] }) => items.map((item) => item?.libelle))),
                          savoir_etre_professionnel: new Set((finalSelectedCompetences?.savoir_etre_professionnel ?? []).flatMap(({ libelle }) => (libelle ? [libelle] : []))),
                          savoir_faire: new Set((finalSelectedCompetences?.savoir_faire ?? []).flatMap(({ items = [] }) => items.map((item) => item?.libelle))),
                        }}
                        title={values.offer_title_custom || romeAndAppellation.appellation}
                        rome={romeAndAppellation.rome}
                        onChange={onSelectedCompetencesChange}
                      />
                    ) : (
                      <Box sx={{ display: ["none", "block"] }}>
                        <InfosDiffusionOffre />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`, pt: fr.spacing("6v") }}>
                <FormulaireEditionOffreButtons offre={offre} />
              </Box>
            </div>
          )
        }}
      </Formik>
    </>
  )
}
