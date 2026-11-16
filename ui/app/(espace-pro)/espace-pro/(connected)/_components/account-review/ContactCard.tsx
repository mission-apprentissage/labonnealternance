"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup"
import { Alert, Box, Typography } from "@mui/material"
import { Formik } from "formik"
import { useEffect, useRef, useState } from "react"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import type { OPCOS_LABEL } from "shared/constants/recruteur"
import { AUTHTYPE } from "shared/constants/recruteur"
import * as Yup from "yup"
import { ContactInfoFields } from "@/app/_components/ContactInfoFields"
import { createSubmitWithFocusOnError, useServerFieldErrors } from "@/app/_components/submit-with-focus-on-error"
import { OpcoSelect } from "@/app/(espace-pro)/_components/OpcoSelect"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useToast } from "@/app/hooks/useToast"
import { emailValidation, frenchPhoneValidation, toSubmittedPhone } from "@/common/validation/field-validations"
import { ConfirmationModificationOpco } from "@/components/espace_pro"
import { updateEntrepriseAdmin } from "@/utils/api"
import { ApiError } from "@/utils/api.utils"
import { EMAIL_ALREADY_USED_ERROR } from "@/utils/validation-messages"

export type ContactAccount = {
  _id: string
  type: string
  first_name: string
  last_name: string
  email: string
  phone: string
  opco: OPCOS_LABEL
  establishment_siret: string
}

const cardSx = (isEditing: boolean) => ({
  border: isEditing ? "2px solid var(--border-plain-blue-france)" : "1px solid var(--border-default-grey)",
  p: isEditing ? "23px" : fr.spacing("6v"),
  display: "flex",
  flexDirection: "column",
  gap: fr.spacing("4v"),
  minWidth: 0,
  // cf. DecisionPanel : les boutons de la carte ne doivent pas hériter de l'espacement des listes de DepotSimplifieLayout.
  '& ul:not([role="listbox"]) li': { mx: "0 !important", mb: "0 !important" },
})

const ReadOnlyRow = ({ label, value }: { label: string; value: string }) => (
  <>
    <Box component="dt" sx={{ fontWeight: 700 }}>
      {label}
    </Box>
    <Box component="dd" sx={{ m: 0, overflowWrap: "anywhere" }}>
      {value || "—"}
    </Box>
  </>
)

/**
 * Lecture par défaut, édition sur place. Même route et mêmes règles que le formulaire de `DetailEntreprise`.
 * `onDirtyChange` permet au parent de bloquer une décision tant qu'une saisie n'est pas enregistrée.
 */
export const ContactCard = ({
  account,
  establishmentLabel,
  onSaved,
  onDirtyChange,
}: {
  account: ContactAccount
  establishmentLabel: string
  onSaved: (props: { opco?: OPCOS_LABEL }) => void
  onDirtyChange: (isDirty: boolean) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const shouldFocusEditButton = useRef(false)
  const confirmationModificationOpco = useDisclosure()
  const serverFieldErrors = useServerFieldErrors()
  const toast = useToast()
  const isEntreprise = account.type === AUTHTYPE.ENTREPRISE

  useEffect(() => {
    if (isEditing) {
      formRef.current?.querySelector<HTMLInputElement>("input, select")?.focus()
    } else if (shouldFocusEditButton.current) {
      shouldFocusEditButton.current = false
      editButtonRef.current?.focus()
    }
  }, [isEditing])

  const closeEdition = () => {
    shouldFocusEditButton.current = true
    setSaveError(null)
    onDirtyChange(false)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <Box sx={cardSx(false)}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: fr.spacing("3v") }}>
          <Typography component="h2" sx={{ m: 0, fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
            Contact
          </Typography>
          <Button
            ref={editButtonRef}
            priority="tertiary"
            size="small"
            iconId="fr-icon-edit-line"
            nativeButtonProps={{ "aria-label": "Modifier le contact" }}
            onClick={() => setIsEditing(true)}
          >
            Modifier
          </Button>
        </Box>
        <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "120px minmax(0, 1fr)", rowGap: fr.spacing("2v"), columnGap: fr.spacing("4v") }}>
          <ReadOnlyRow label="Nom" value={`${account.first_name} ${account.last_name}`.trim()} />
          <ReadOnlyRow label="E-mail" value={account.email} />
          <ReadOnlyRow label="Téléphone" value={account.phone} />
          {isEntreprise && <ReadOnlyRow label="OPCO" value={account.opco} />}
        </Box>
      </Box>
    )
  }

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        last_name: account.last_name,
        first_name: account.first_name,
        phone: account.phone,
        email: account.email,
        opco: account.opco,
        type: account.type,
      }}
      validationSchema={Yup.object().shape({
        last_name: Yup.string().required("champ obligatoire"),
        first_name: Yup.string().required("champ obligatoire"),
        phone: frenchPhoneValidation().required("champ obligatoire"),
        email: emailValidation().required("champ obligatoire"),
        type: Yup.string().default(account.type),
        opco: Yup.string().when("type", { is: (v: unknown) => v === AUTHTYPE.ENTREPRISE, then: (schema) => schema.min(1, "champ obligatoire").required("champ obligatoire") }),
      })}
      validate={serverFieldErrors.validate}
      onSubmit={async (values, { setFieldError, setFieldValue }) => {
        const phone = toSubmittedPhone(values.phone)
        setFieldValue("phone", phone, false)
        const { type: _type, ...body } = { ...values, phone }
        setSaveError(null)
        try {
          await updateEntrepriseAdmin(account._id, isEntreprise ? body : { ...body, opco: undefined }, account.establishment_siret)
        } catch (error) {
          if (error instanceof ApiError && error.context.errorData?.error === BusinessErrorCodes.EMAIL_ALREADY_EXISTS) {
            serverFieldErrors.setServerFieldError(setFieldError, "email", values.email, EMAIL_ALREADY_USED_ERROR)
            return
          }
          setSaveError(
            error instanceof ApiError && error.context.statusCode === 400 ? error.message : "La mise à jour n'a pas pu être enregistrée. Veuillez réessayer ultérieurement."
          )
          return
        }
        toast({ title: "Mise à jour enregistrée avec succès" })
        closeEdition()
        onSaved({ opco: isEntreprise ? values.opco : undefined })
      }}
    >
      {(formik) => {
        const { values, isSubmitting, setFieldValue, errors, touched, dirty, resetForm } = formik
        // Le bouton « Enregistrer » ne dépend pas de isValid : cf. createSubmitWithFocusOnError.
        const handleSubmit = createSubmitWithFocusOnError(formRef, formik)
        const cancel = () => {
          resetForm()
          closeEdition()
        }
        return (
          <Box sx={cardSx(true)}>
            <DirtyReporter dirty={dirty} onDirtyChange={onDirtyChange} />
            <ConfirmationModificationOpco
              {...confirmationModificationOpco}
              establishment_raison_sociale={establishmentLabel}
              setFieldValue={setFieldValue}
              previousValue={account.opco}
              newValue={values.opco}
            />
            <Typography component="h2" sx={{ m: 0, fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
              Modifier le contact
            </Typography>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              noValidate
              onKeyDown={(event) => {
                if (event.key === "Escape" && !confirmationModificationOpco.isOpen) {
                  event.preventDefault()
                  cancel()
                }
              }}
            >
              <ContactInfoFields thirdParty />
              {isEntreprise && (
                <OpcoSelect
                  value={values.opco}
                  name="opco"
                  errors={errors}
                  touched={touched}
                  onChange={(newValue) => {
                    setFieldValue("opco", newValue)
                    confirmationModificationOpco.onOpen()
                  }}
                />
              )}
              {saveError && (
                <Alert sx={{ mb: fr.spacing("4v") }} severity="error">
                  {saveError}
                </Alert>
              )}
              <Box sx={{ borderTop: "1px solid var(--border-default-grey)", pt: fr.spacing("4v") }}>
                <ButtonsGroup
                  inlineLayoutWhen="always"
                  alignment="right"
                  buttons={[
                    { children: "Annuler", priority: "secondary", type: "button", onClick: cancel },
                    { children: "Enregistrer", type: "submit", disabled: isSubmitting },
                  ]}
                />
              </Box>
            </form>
          </Box>
        )
      }}
    </Formik>
  )
}

const DirtyReporter = ({ dirty, onDirtyChange }: { dirty: boolean; onDirtyChange: (isDirty: boolean) => void }) => {
  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])
  return null
}
