"use client"

import { Box, Collapse, Typography } from "@mui/material"
import { Form, Formik } from "formik"
import * as Yup from "yup"
import { fr } from "@codegouvfr/react-dsfr"
import Select from "@codegouvfr/react-dsfr/Select"
import Input from "@codegouvfr/react-dsfr/Input"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import Tooltip from "@codegouvfr/react-dsfr/Tooltip"
import Button from "@codegouvfr/react-dsfr/Button"
import dayjs from "dayjs"
import type { InputSimulation } from "@/services/simulateurAlternant"
import { getSimulationInformation } from "@/services/simulateurAlternant"
import { useSimulateur } from "@/app/(landing-pages)/simulateur/context/SimulateurContext"

const ISO_DATE_FORMAT = "YYYY-MM-DD"

const minDateDebutContrat = dayjs().startOf("year")
const nextStartOfMonth = dayjs().add(1, "month").startOf("month")
const minDateNaissance = dayjs().subtract(77, "years")
const maxDateNaissance = dayjs().subtract(14, "years")

const inputSchema = Yup.object().shape({
  typeContrat: Yup.string().oneOf(["apprentissage", "professionnalisation"]).required("Champ obligatoire"),
  dateNaissance: Yup.date()
    .min(minDateNaissance, "Votre âge n'est pas éligible à l'apprentissage. Veuillez renseigner un âge entre 14 et 77 ans.")
    .max(maxDateNaissance, "Votre âge n'est pas éligible à l'apprentissage. Veuillez renseigner un âge entre 14 et 77 ans.")
    .required("Champ obligatoire"),
  isDateDebutContratConnue: Yup.boolean().when("typeContrat", {
    is: "apprentissage",
    then: (schema) => schema.required("Champ obligatoire"),
    otherwise: (schema) => schema.notRequired(),
  }),
  dateDebutContrat: Yup.date()
    .when("isDateDebutContratConnue", {
      is: true,
      then: (schema) => schema.required("Champ obligatoire"),
      otherwise: (schema) => schema.notRequired(),
    })
    .min(minDateDebutContrat, `La date de début de contrat doit être dans l'année civile en cours ou ultérieure.`),
  niveauDiplome: Yup.number().when("typeContrat", {
    is: "professionnalisation",
    then: (schema) => schema.required("Champ obligatoire").min(1).max(8),
    otherwise: (schema) => schema.notRequired(),
  }),
  dureeContrat: Yup.number()
    .min(1, "La durée du contrat doit être comprise entre 1 et 4 ans")
    .max(4, "La durée du contrat doit être comprise entre 1 et 4 ans")
    .required("Champ obligatoire"),
  secteur: Yup.string().oneOf(["public", "privé", "nsp"]).required("Champ obligatoire"),
  isRegionMayotte: Yup.boolean().default(false),
})

type InputSchemaType = Yup.InferType<typeof inputSchema>

const typeContratOptions = [
  { value: "apprentissage", label: "Contrat en apprentissage" },
  { value: "professionnalisation", label: "Contrat de professionnalisation" },
]

const niveauDiplomeOptions = [
  { value: 8, label: "Niveau 8 (doctorat)" },
  { value: 7, label: "Niveau 7 (master, diplôme d'école de commerce, diplôme d'ingénieur, etc.)" },
  { value: 6, label: "Niveau 6 (licence, 1ère année de master, BUT, etc.)" },
  { value: 5, label: "Niveau 5 (BTS, etc.)" },
  { value: 4, label: "Niveau 4 (baccalauréat, etc.)" },
  { value: 3, label: "Niveau 3 (CAP, BEP, etc.)" },
  { value: 2, label: "Niveau 2 (brevet, certificat de formation générale)" },
  { value: 1, label: "Niveau 1 (aucun diplôme ou titre professionnel)" },
]

const isDateDebutContratConnueOptions = [
  { value: true, label: "Je connais la date de début de contrat" },
  { value: false, label: "Je ne connais pas la date de début de contrat" },
]

const dureeContratOptions = [
  { value: 1, label: "1 an ou moins" },
  { value: 2, label: "2 ans" },
  { value: 3, label: "3 ans" },
  { value: 4, label: "4 ans" },
]

const secteurOptions = [
  { value: "public", label: "Public" },
  { value: "privé", label: "Privé" },
  { value: "nsp", label: "Je ne sais pas" },
]

const isApprentissage = (typeContrat: string | undefined) => typeContrat === "apprentissage"
const isProfessionnalisation = (typeContrat: string | undefined) => typeContrat === "professionnalisation"

export const FormulaireSituation = () => {
  const { setSimulation } = useSimulateur()

  const initialValues: InputSchemaType = {
    typeContrat: undefined,
    dateNaissance: undefined,
    isDateDebutContratConnue: undefined,
    dateDebutContrat: undefined,
    dureeContrat: undefined,
    niveauDiplome: undefined,
    secteur: undefined,
    isRegionMayotte: false,
  }

  const onSubmit = (values: InputSchemaType) => {
    const inputSimulation: InputSimulation = {
      ...values,
      typeContrat: values.typeContrat,
      niveauDiplome: Number(values.niveauDiplome),
      secteur: values.secteur,
      dureeContrat: Number(values.dureeContrat),
      dateNaissance: dayjs(values.dateNaissance).toDate(),
      dateDebutContrat: dayjs(values.dateDebutContrat).toDate(),
      isRegionMayotte: values.isRegionMayotte,
    }

    setSimulation(getSimulationInformation(inputSimulation))
  }

  return (
    <Box sx={{ margin: "0 auto", padding: 2, gap: 2, display: "flex", flexDirection: "column" }}>
      <Typography variant="h2" color={fr.colors.decisions.text.title.blueFrance.default} gutterBottom>
        Votre situation :
      </Typography>
      <Typography variant="caption" color={fr.colors.decisions.text.mention.grey.default} gutterBottom>
        Sauf mention contraire “(optionnel)” , tous les champs sont obligatoires.
      </Typography>
      <Formik validateOnMount={true} enableReinitialize={true} initialValues={initialValues} validationSchema={inputSchema} onSubmit={onSubmit}>
        {({ values, errors, touched, isValid, dirty, handleChange, handleBlur, setValues }) => (
          <Form>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Box my={fr.spacing("2v")}>
                <RadioButtons
                  style={{
                    marginTop: 0,
                    marginBottom: 0,
                  }}
                  legend="Type de contrat :"
                  name="typeContrat"
                  options={typeContratOptions.map((option) => ({
                    label: option.label,
                    nativeInputProps: {
                      value: option.value,
                      checked: values.typeContrat === option.value,
                      onChange: handleChange,
                    },
                  }))}
                  state={touched.typeContrat && errors.typeContrat ? "error" : "default"}
                  stateRelatedMessage={touched.typeContrat && errors.typeContrat ? `${errors.typeContrat}` : undefined}
                />
              </Box>
              <Box my={fr.spacing("2v")}>
                <Input
                  id="dateNaissance"
                  label={
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1">Date de naissance</Typography>
                      <Tooltip title={"Votre âge détermine votre éligibilité au contrat et vos conditions salariales."} kind="click" />
                    </Box>
                  }
                  hintText="Format attendu : JJ/MM/AAAA"
                  nativeInputProps={{
                    name: "dateNaissance",
                    type: "date",
                    onChange: handleChange,
                    onBlur: handleBlur,
                  }}
                  state={touched.dateNaissance ? (errors.dateNaissance ? "error" : "info") : "default"}
                  stateRelatedMessage={
                    touched.dateNaissance ? (errors.dateNaissance ? `${errors.dateNaissance}` : `Vous avez ${dayjs().diff(dayjs(values.dateNaissance), "years")} ans`) : undefined
                  }
                />
              </Box>
              <Collapse in={isProfessionnalisation(values.typeContrat)}>
                <Box my={fr.spacing("2v")}>
                  <Select
                    label="Votre niveau de diplôme actuel :"
                    nativeSelectProps={{
                      name: "niveauDiplome",
                      value: values.niveauDiplome,
                      onChange: handleChange,
                    }}
                    state={touched.niveauDiplome && errors.niveauDiplome ? "error" : "default"}
                    stateRelatedMessage={touched.niveauDiplome && errors.niveauDiplome ? `${errors.niveauDiplome}` : undefined}
                  >
                    <option value="">Sélectionnez une option</option>
                    {niveauDiplomeOptions.map((option) => (
                      <option key={`${option.label}-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Box>
              </Collapse>
              <Collapse in={isApprentissage(values.typeContrat)}>
                <Box my={fr.spacing("2v")}>
                  <RadioButtons
                    style={{
                      marginTop: 0,
                      marginBottom: 0,
                    }}
                    name="isDateDebutContratConnue"
                    legend="Date de début de contrat"
                    options={isDateDebutContratConnueOptions.map((option) => ({
                      label: option.label,
                      nativeInputProps: {
                        checked: values.isDateDebutContratConnue === option.value,
                        onChange: () => {
                          setValues((values) => ({
                            ...values,
                            isDateDebutContratConnue: option.value,
                            dateDebutContrat: option.value ? undefined : nextStartOfMonth.toDate(),
                          }))
                        },
                      },
                    }))}
                    state={touched.isDateDebutContratConnue && errors.isDateDebutContratConnue ? "error" : "default"}
                    stateRelatedMessage={touched.isDateDebutContratConnue && errors.isDateDebutContratConnue ? `${errors.isDateDebutContratConnue}` : undefined}
                  />
                </Box>
                <Box my={fr.spacing("2v")}>
                  <Input
                    id="dateDebutContrat"
                    label="Date de signature du contrat"
                    hintText="Format attendu : JJ/MM/AAAA"
                    nativeInputProps={{
                      name: "dateDebutContrat",
                      type: "date",
                      value: values.dateDebutContrat
                        ? typeof values.dateDebutContrat === "string"
                          ? values.dateDebutContrat
                          : dayjs(values.dateDebutContrat).format(ISO_DATE_FORMAT)
                        : "",
                      onChange: handleChange,
                      onBlur: handleBlur,
                    }}
                    disabled={values.isDateDebutContratConnue === false}
                    state={touched.dateDebutContrat && errors.dateDebutContrat ? "error" : "default"}
                    stateRelatedMessage={touched.dateDebutContrat && errors.dateDebutContrat ? `${errors.dateDebutContrat}` : undefined}
                  />
                </Box>
              </Collapse>
              <Box my={fr.spacing("2v")}>
                <Select
                  label={
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1">Durée du contrat</Typography>
                      <Tooltip
                        title={"La durée de votre contrat varie en fonction de la formation choisie. Votre rémunération augmentera à chaque nouvelle année d’exécution du contrat."}
                        kind="click"
                      />
                    </Box>
                  }
                  nativeSelectProps={{
                    name: "dureeContrat",
                    value: values.dureeContrat,
                    onChange: handleChange,
                  }}
                  state={touched.dureeContrat && errors.dureeContrat ? "error" : "default"}
                  stateRelatedMessage={touched.dureeContrat && errors.dureeContrat ? `${errors.dureeContrat}` : undefined}
                >
                  <option value="">Sélectionnez une durée</option>
                  {dureeContratOptions.map((option) => (
                    <option key={`${option.label}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Box>
              <Collapse in={isApprentissage(values.typeContrat) || isProfessionnalisation(values.typeContrat)}>
                <Box my={fr.spacing("2v")}>
                  <RadioButtons
                    style={{
                      marginTop: 0,
                      marginBottom: 0,
                    }}
                    legend={
                      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                        <Typography variant="body1">Secteur de l'entreprise</Typography>
                        <Tooltip
                          title={
                            "Le niveau de cotisation salariale diffère entre le secteur privé et public (mairies, administrations, ...) impactant le salaire net. Le secteur public à caractère industriel et commercial doit être considéré comme du privé. Si vous n'avez pas ces informations, le salaire obtenu pourra être supérieur mais jamais inférieur."
                          }
                          kind="click"
                        />
                      </Box>
                    }
                    name="secteur"
                    options={secteurOptions.map((option) => ({
                      label: option.label,
                      nativeInputProps: {
                        value: option.value,
                        onChange: handleChange,
                      },
                      required: isApprentissage(values.typeContrat),
                    }))}
                    orientation="horizontal"
                    state={touched.secteur && errors.secteur ? "error" : "default"}
                    stateRelatedMessage={touched.secteur && errors.secteur ? `${errors.secteur}` : undefined}
                  />
                </Box>
              </Collapse>
              <Box my={fr.spacing("2v")}>
                <Checkbox
                  options={[
                    {
                      label: (
                        <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
                          <Typography mt={"auto"}>Le contrat s'exécute à Mayotte</Typography>
                          <Typography variant="caption" color={fr.colors.decisions.text.mention.grey.default} mt={"auto"}>
                            (optionnel)
                          </Typography>
                          <Tooltip
                            style={{
                              margin: "auto",
                            }}
                            title={"À Mayotte, le SMIC horaire diffère du reste de la France, ce qui impacte la rémunération de l'alternant."}
                          />
                        </Box>
                      ),
                      nativeInputProps: {
                        name: "isRegionMayotte",
                        onChange: (e) => {
                          setValues({
                            ...values,
                            isRegionMayotte: e.target.checked,
                          })
                        },
                      },
                    },
                  ]}
                />
              </Box>
              <Box mt={fr.spacing("6v")}>
                <Button type="submit" iconId="fr-icon-refresh-line" disabled={!(isValid && dirty)}>
                  Calculer la rémunération
                </Button>
              </Box>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  )
}
