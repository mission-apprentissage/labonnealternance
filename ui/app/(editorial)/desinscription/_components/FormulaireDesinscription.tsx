import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, CircularProgress, Typography } from "@mui/material"
import { captureException } from "@sentry/browser"
import { useMutation } from "@tanstack/react-query"
import { FormikContext, useFormik } from "formik"
import { useRef, useState } from "react"
import type { IUnsubscribePossibleCompany } from "shared/routes/unsubscribe.routes"
import * as Yup from "yup"

import CustomDSFRInput from "@/app/_components/CustomDSFRInput"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { publicConfig } from "@/config.public"
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

// Reprend la taille des h2 de DepotSimplifieStyling, qui ne s'applique pas à un <p>
const sousTitreSx = { fontSize: { xs: "16px", lg: "24px" }, lineHeight: { xs: "24px", lg: "32px" } }

const SupportLink = ({ subject }: { subject: string }) => {
  const fullSubject = `Candidature spontanée - Déréférencement - ${subject}`
  return (
    <DsfrLink external href={`mailto:${publicConfig.publicEmail}?subject=${encodeURIComponent(fullSubject)}`}>
      support
    </DsfrLink>
  )
}

const errorMessages = {
  // <span> : .fr-message est en flex, le lien y deviendrait un bloc à part
  NON_RECONNU: (
    <span>
      Aucun établissement ne correspond à cet e-mail. Vérifiez l’adresse saisie ou contactez notre <SupportLink subject="Email inconnu" />.
    </span>
  ),
  unexpected_error: (
    <>
      Une erreur technique s'est produite. Veuillez réessayer ultérieurement. Vous pouvez aussi contacter notre <SupportLink subject="Erreur technique" />
    </>
  ),
}

type IErrorKey = keyof typeof errorMessages

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
  const [isOpen, setIsOpen] = useState(true)
  const [selectedSirets, setSelectedSirets] = useState(allSirets)
  const [hasSubmitAttempt, setHasSubmitAttempt] = useState(false)
  const fieldsetRef = useRef<HTMLFieldSetElement>(null)
  const areAllSelected: boolean = companies.length === selectedSirets.length
  const hasSelectionError = hasSubmitAttempt && !selectedSirets.length

  const mutation = useMutation({
    mutationFn: async ({ sirets }: { sirets: string[] }) => {
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

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  const handleSubmit = () => {
    setHasSubmitAttempt(true)
    if (!selectedSirets.length) {
      fieldsetRef.current?.querySelector<HTMLInputElement>("input")?.focus()
      return
    }
    mutation.mutate({ sirets: selectedSirets })
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={handleClose}>
      <Box sx={{ p: fr.spacing("6v") }}>
        <Typography variant="h3" sx={{ mb: fr.spacing("6v") }}>
          Plusieurs établissements correspondent à cet e-mail
        </Typography>
        <Box>
          <Checkbox
            ref={fieldsetRef}
            legend="Sélectionnez les établissements pour lesquels vous ne souhaitez plus recevoir de candidatures spontanées."
            state={hasSelectionError ? "error" : "default"}
            stateRelatedMessage={hasSelectionError ? "Sélectionnez au moins un établissement." : undefined}
            options={companies.map((company) => ({
              label: `SIRET ${company.siret}`,
              hintText: (
                <>
                  {company.enseigne}
                  <br />
                  {company.address}
                </>
              ),
              nativeInputProps: {
                name: "sirets",
                value: company.siret,
                checked: isSiretSelected(company.siret),
                onChange: () => toggleSiretSelection(company.siret),
              },
            }))}
          />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Checkbox options={[{ label: "Tout sélectionner", nativeInputProps: { checked: areAllSelected, onChange: toggleSelectAll } }]} />
            {!isSubmitting ? <Button onClick={handleSubmit}>Déréférencer</Button> : <CircularProgress />}
          </Box>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}

export const FormulaireDesinscription = ({ companyEmail, handleUnsubscribeSuccess }: { companyEmail?: string; handleUnsubscribeSuccess: () => void }) => {
  const [errorKey, setErrorKey] = useState<IErrorKey | null>(null)
  const [possibleCompanies, setPossibleCompanies] = useState<IUnsubscribePossibleCompany[] | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleError = (error: any) => {
    if (error && error instanceof ApiError && error.isNotFoundError()) {
      setErrorKey("NON_RECONNU")
      formRef.current?.querySelector<HTMLInputElement>('[name="email"]')?.focus()
    } else {
      captureException(error)
      setErrorKey("unexpected_error")
    }
  }

  const onUnsubscribeSubmit = async (values: { reason: string; email: string }) => {
    setErrorKey(null)
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
      reason: Yup.string().required("Sélectionnez un motif"),
      email: Yup.string().email("Saisissez une adresse e-mail valide, par exemple nom@domaine.fr").required("Saisissez l’e-mail de l’établissement"),
    }),
    initialValues: { email: companyEmail ?? "", reason: "" },
    onSubmit: onUnsubscribeSubmit,
    enableReinitialize: true,
  })

  const onUnsubscribeSiretsSubmit = async (sirets: string[]) => {
    setErrorKey(null)
    try {
      await unsubscribeCompanySirets({ sirets, ...formik.values })
      handleUnsubscribeSuccess()
    } catch (error) {
      handleError(error)
    }
  }

  const { isSubmitting, setFieldValue, values, touched, errors, handleBlur } = formik
  const reasonError = touched.reason && errors.reason
  // Le bouton "Confirmer" ne dépend pas de isValid : cf. createSubmitWithFocusOnError.
  const handleSubmit = createSubmitWithFocusOnError(formRef, formik)

  return (
    <Box>
      {possibleCompanies && <ConfirmationDesinscription onClose={() => setPossibleCompanies(null)} companies={possibleCompanies} onSubmit={onUnsubscribeSiretsSubmit} />}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "column", md: "row" }, gap: fr.spacing("6v"), mb: fr.spacing("6v") }}>
        <Box>
          <Typography variant="h1" sx={{ mb: fr.spacing("6v"), color: fr.colors.decisions.text.active.blueFrance.default }}>
            Vous êtes une entreprise
          </Typography>
          <Typography component="p" variant="h2" sx={{ ...sousTitreSx, mb: fr.spacing("6v") }}>
            Vous souhaitez ne plus recevoir de candidatures spontanées de La bonne alternance
          </Typography>
          <Typography component="p" variant="h2" sx={sousTitreSx}>
            Veuillez remplir le formulaire ci-contre.
          </Typography>
        </Box>
        <Box>
          <FormikContext value={formik}>
            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              <Typography sx={{ fontSize: "14px", lineHeight: "24px", color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("4v") }}>
                Tous les champs sont obligatoires.
              </Typography>
              <CustomDSFRInput
                label="E-mail de l'établissement"
                hintText="Format attendu : nom@domaine.fr. Indiquez l'e-mail sur lequel vous recevez les candidatures."
                required={true}
                name="email"
                errorMessage={errorKey === "NON_RECONNU" ? errorMessages.NON_RECONNU : undefined}
                nativeInputProps={{
                  type: "email",
                  name: "email",
                  required: true,
                  autoComplete: "email",
                  placeholder: "Adresse e-mail de contact de la société...",
                }}
              />

              <Box sx={{ mt: fr.spacing("6v") }}>
                <Select
                  label="Motif"
                  hint="Indiquez la raison pour laquelle vous ne souhaitez plus recevoir de candidature"
                  state={reasonError ? "error" : "default"}
                  stateRelatedMessage={reasonError || undefined}
                  nativeSelectProps={{
                    onChange: async (event) => setFieldValue("reason", event.target.value, true),
                    onBlur: handleBlur,
                    name: "reason",
                    value: values.reason,
                    required: true,
                    "aria-invalid": Boolean(reasonError),
                  }}
                >
                  <option disabled hidden value="">
                    Sélectionnez une valeur...
                  </option>
                  {unsubscribeReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </Select>
              </Box>

              {errorKey === "unexpected_error" && (
                <Box role="alert" sx={{ display: "flex", alignItems: "center", color: fr.colors.decisions.text.actionHigh.redMarianne.default, mt: fr.spacing("2v") }}>
                  <Warning sx={{ m: 0 }} />
                  <Box
                    sx={{
                      ml: fr.spacing("2v"),
                    }}
                  >
                    {errorMessages.unexpected_error}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: fr.spacing("6v") }}>
                {!isSubmitting ? <Button type="submit">Confirmer</Button> : <CircularProgress />}
              </Box>
            </form>
          </FormikContext>
        </Box>
      </Box>
    </Box>
  )
}
