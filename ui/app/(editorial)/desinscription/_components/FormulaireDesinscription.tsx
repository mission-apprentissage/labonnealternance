import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, Stack, Typography, Checkbox, FormControlLabel, CircularProgress } from "@mui/material"
import { captureException } from "@sentry/browser"
import { useMutation } from "@tanstack/react-query"
import { Form, FormikContext, useFormik } from "formik"
import { useState } from "react"
import { IUnsubscribePossibleCompany } from "shared/routes/unsubscribe.routes"
import * as Yup from "yup"

import CustomDSFRInput from "@/app/_components/CustomDSFRInput"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { Warning } from "@/theme/components/icons"
import { unsubscribeCompany, unsubscribeCompanySirets } from "@/utils/api"
import { ApiError } from "@/utils/api.utils"

const unsubscribeReasons = [
  "Nous avons déjà trouvé nos alternants pour l’année en cours",
  "Les candidatures ne correspondent pas aux activités de mon entreprise",
  "J'utilise d'autres canaux pour mes recrutements d'alternants",
  "Mon entreprise n’a pas la capacité financière pour recruter un alternant",
  "Mon entreprise ne recrute pas en alternance",
  "Je m'oppose au traitement des mes données par La bonne alternance",
  "L’entreprise est fermée",
  "Autre",
]

const SupportLink = ({ subject }: { subject: string }) => {
  const fullSubject = `Candidature spontanée - Déréférencement - ${subject}`
  return (
    <DsfrLink external href={`mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=${encodeURIComponent(fullSubject)}`}>
      support
    </DsfrLink>
  )
}

const errorMessages = {
  NON_RECONNU: (
    <>
      Votre établissement n’est pas reconnu. Veuillez saisir une adresse email valide. Vous pouvez aussi contacter notre <SupportLink subject="Email inconnu" />.
    </>
  ),
  ETABLISSEMENTS_MULTIPLES: (
    <>
      Plusieurs établissements correspondent à cet email, veuillez contacter notre <SupportLink subject="Plusieurs établissements" /> pour procéder au déréférencement de tout ou
      partie de ces établissements
    </>
  ),
  unexpected_error: (
    <>
      Une erreur technique s'est produite. Veuillez réessayer ultérieurement. Vous pouvez aussi contacter notre <SupportLink subject="Erreur technique" />
    </>
  ),
}

const ConfirmationDesinscription = ({
  companies,
  onSubmit,
  onClose,
}: {
  companies: IUnsubscribePossibleCompany[]
  onSubmit: (sirets: string[]) => Promise<void>
  onClose: () => void
}) => {
  const allSirets = companies.map((company) => company.siret)
  const [selectedSirets, setSelectedSirets] = useState(allSirets)
  const areAllSelected: boolean = companies.length === selectedSirets.length

  const mutation = useMutation({
    mutationFn: ({ sirets }: { sirets: string[] }) => {
      return onSubmit(sirets)
    },
  })
  const isSubmitting = mutation.isPending

  const isSiretSelected = (siret: string) => selectedSirets.includes(siret)

  const toggleSiretSelection = (siret: string) => {
    const isChecked = isSiretSelected(siret)
    if (isChecked) {
      setSelectedSirets(selectedSirets.filter((siretIte) => siretIte !== siret))
    } else {
      setSelectedSirets([...selectedSirets, siret])
    }
  }

  const toggleSelectAll = () => {
    if (areAllSelected) {
      setSelectedSirets([])
    } else {
      setSelectedSirets(allSirets)
    }
  }

  return (
    <ModalReadOnly isOpen={true} onClose={onClose}>
      <Box sx={{ p: fr.spacing("3w") }}>
        <Typography variant="h3" sx={{ mb: fr.spacing("3w") }}>
          Plusieurs établissements correspondent à cet email
        </Typography>
        <Box>
          <Typography sx={{ mb: fr.spacing("3w") }}>Veuillez sélectionner les établissements pour lesquels vous ne souhaitez plus recevoir de candidatures spontanées.</Typography>

          {companies.map((company) => (
            <Box sx={{ display: "flex", alignItems: "center", border: "1px solid #E5E5E5", mb: fr.spacing("2w"), px: fr.spacing("2w"), py: fr.spacing("2v") }} key={company.siret}>
              <Checkbox onChange={() => toggleSiretSelection(company.siret)} checked={isSiretSelected(company.siret)} value={company.siret} />
              <Stack spacing={fr.spacing("1w")} sx={{ ml: fr.spacing("3w") }}>
                <Typography>SIRET: {company.siret}</Typography>
                <Typography>
                  {company.enseigne}
                  <br />
                  {company.address}
                </Typography>
              </Stack>
            </Box>
          ))}

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <FormControlLabel control={<Checkbox defaultChecked onChange={toggleSelectAll} checked={areAllSelected} />} label="Tout sélectionner" />
            {!isSubmitting ? (
              <Button
                disabled={isSubmitting || !selectedSirets.length}
                onClick={() => {
                  if (selectedSirets.length) {
                    mutation.mutate({ sirets: selectedSirets })
                  }
                }}
              >
                Déréférencer
              </Button>
            ) : (
              <CircularProgress />
            )}
          </Box>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}

export const FormulaireDesinscription = ({ companyEmail, handleUnsubscribeSuccess }: { companyEmail?: string; handleUnsubscribeSuccess: () => void }) => {
  const [errorMessage, setErrorMessage] = useState(null)
  const [possibleCompanies, setPossibleCompanies] = useState<IUnsubscribePossibleCompany[] | null>(null)

  const handleError = (error: any) => {
    if (error && error instanceof ApiError && error.isNotFoundError()) {
      setErrorMessage(errorMessages.NON_RECONNU)
    } else {
      captureException(error)
      setErrorMessage(errorMessages.unexpected_error)
    }
  }

  const onUnsubscribeSubmit = async (values: { reason: string; email: string }) => {
    setErrorMessage(null)
    try {
      const response = await unsubscribeCompany(values)
      if ("possibleCompanies" in response && response.possibleCompanies?.length) {
        setPossibleCompanies(response.possibleCompanies as IUnsubscribePossibleCompany[])
      } else {
        handleUnsubscribeSuccess()
      }
    } catch (error) {
      handleError(error)
    }
  }

  const formik = useFormik({
    validationSchema: Yup.object().shape({
      reason: Yup.string().required("Vous devez sélectionner un motif"),
      email: Yup.string().email("Veuillez saisir une adresse email valide").required("Veuillez saisir une adresse email valide"),
    }),
    initialValues: { email: companyEmail, reason: undefined },
    onSubmit: onUnsubscribeSubmit,
    enableReinitialize: true,
  })

  const onUnsubscribeSiretsSubmit = async (sirets: string[]) => {
    setErrorMessage(null)
    try {
      await unsubscribeCompanySirets({ sirets, ...formik.values })
      handleUnsubscribeSuccess()
    } catch (error) {
      handleError(error)
    }
  }

  const { isSubmitting, setFieldValue, isValid, dirty } = formik

  return (
    <Box>
      {possibleCompanies && <ConfirmationDesinscription onClose={() => setPossibleCompanies(null)} companies={possibleCompanies} onSubmit={onUnsubscribeSiretsSubmit} />}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "column", md: "row" }, gap: fr.spacing("3w"), mb: fr.spacing("3w") }}>
        <Box>
          <Typography variant="h1" sx={{ mb: fr.spacing("3w"), color: fr.colors.decisions.text.active.blueFrance.default }}>
            Vous êtes une entreprise
          </Typography>
          <Typography variant="h2" sx={{ mb: fr.spacing("3w") }}>
            Vous souhaitez ne plus recevoir de candidatures spontanées de La bonne alternance
          </Typography>
          <Typography variant="h2">Veuillez remplir le formulaire ci-contre.</Typography>
        </Box>
        <Box>
          <FormikContext value={formik}>
            <Form>
              <CustomDSFRInput
                label="Email de l'établissement *"
                hintText="Indiquez l'email sur lequel sont actuellement reçues les candidatures"
                required={true}
                name="email"
                nativeInputProps={{
                  type: "email",
                  name: "email",
                  placeholder: "Adresse email de contact de la société...",
                }}
              />

              <Box sx={{ mt: fr.spacing("3w") }}>
                <Select
                  label="Motif *"
                  hint="Indiquez la raison pour laquelle vous ne souhaitez plus recevoir de candidature"
                  nativeSelectProps={{
                    onChange: (event) => setFieldValue("reason", event.target.value, true),
                    name: "reason",
                    required: true,
                  }}
                >
                  <option disabled hidden selected value="">
                    Sélectionnez une valeur...
                  </option>
                  {unsubscribeReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </Select>
              </Box>

              {errorMessage && (
                <Box sx={{ display: "flex", alignItems: "center", color: fr.colors.decisions.text.actionHigh.redMarianne.default, mt: fr.spacing("1w") }}>
                  <Warning sx={{ m: 0 }} />
                  <Box ml={1}>{errorMessage}</Box>
                </Box>
              )}

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: fr.spacing("3w") }}>
                <Typography>Tous les champs sont obligatoires</Typography>

                {!isSubmitting ? (
                  <Button disabled={isSubmitting || !isValid || !dirty} type="submit">
                    Confirmer
                  </Button>
                ) : (
                  <CircularProgress />
                )}
              </Box>
            </Form>
          </FormikContext>
        </Box>
      </Box>
    </Box>
  )
}
