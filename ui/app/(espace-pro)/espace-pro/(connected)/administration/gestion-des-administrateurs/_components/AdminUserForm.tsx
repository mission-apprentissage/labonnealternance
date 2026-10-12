import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box } from "@mui/material"
import { FormikProvider, useFormik } from "formik"
import { useRef } from "react"
import type { IRoleManagementEvent, IRoleManagementJson } from "shared"
import { AccessStatus, getLastStatusEvent, parseEnum } from "shared"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import { OPCOS_LABEL } from "shared/constants/index"
import { AUTHTYPE } from "shared/constants/recruteur"
import type { INewSuperUser, IUserWithAccountJson } from "shared/models/user-with-account.model"
import type { Jsonify } from "type-fest"
import { toFormikValidationSchema } from "zod-formik-adapter"

import CustomInput from "@/app/_components/CustomInput"
import { createSubmitWithFocusOnError, useServerFieldErrors } from "@/app/_components/submit-with-focus-on-error"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useUserPermissionsActions } from "@/app/hooks/use-user-permissions-actions"
import { useToast } from "@/app/hooks/useToast"
import { toSubmittedPhone } from "@/common/validation/field-validations"
import { createSuperUser, updateUser } from "@/utils/api"
import { ApiError, apiDelete } from "@/utils/api.utils"
import { EMAIL_ALREADY_USED_ERROR, EMAIL_FORMAT_HINT, PHONE_FORMAT_HINT } from "@/utils/validation-messages"
import { AdminConfirmationModal } from "./AdminConfirmationModal"
import { buildAdminUserFormSchema } from "./admin-user-form.schema"

const { OPCO, ADMIN } = AUTHTYPE

export const AdminUserForm = ({
  user,
  role,
  onCreate,
  onDelete,
  onUpdate,
}: {
  user?: IUserWithAccountJson
  role?: IRoleManagementJson
  onCreate?: (_id: string) => void
  onDelete?: () => void
  onUpdate?: () => void
}) => {
  const toast = useToast()
  const deactivateModal = useDisclosure()
  const deleteModal = useDisclosure()
  const { activate: activateUser, deactivate: deactivateUser } = useUserPermissionsActions(user?._id.toString(), role?.authorized_id ?? "")

  const errorHandler = (onEmailAlreadyUsed: (message: string) => void) => (error: any) => {
    if (error instanceof ApiError && error.context.errorData?.error === BusinessErrorCodes.EMAIL_ALREADY_EXISTS) {
      onEmailAlreadyUsed(EMAIL_ALREADY_USED_ERROR)
      return
    }
    if (error && error instanceof ApiError && error.context?.statusCode >= 400) {
      error = error.context.message
    }
    toast({
      title: error + "",
      variant: "error",
    })
  }

  const onSubmit = async (values: INewSuperUser, onEmailAlreadyUsed: (message: string) => void) => {
    if (user) {
      const { email, first_name, last_name, phone = "" } = values
      await updateUser(user._id.toString(), { email, first_name, last_name, phone })
        .then(() => {
          toast({
            title: "Utilisateur mis à jour",
          })
          onUpdate?.()
        })
        .catch(errorHandler(onEmailAlreadyUsed))
    } else {
      const { email, first_name, last_name, phone = "", type } = values
      const commonFields = { email, first_name, last_name, phone, type }
      const sentFields = { ...commonFields, ...(type === OPCO ? { opco: values.opco } : {}) }
      /* @ts-ignore TODO */
      await createSuperUser(sentFields)
        .then((user) => {
          toast({
            title: "Utilisateur créé",
          })
          onCreate?.(user._id.toString())
        })
        .catch(errorHandler(onEmailAlreadyUsed))
    }
  }

  const deleteUser = async () => {
    // apiDelete lève une ApiError sur une réponse HTTP en erreur, `ok: false` couvre le refus signalé dans une réponse 200
    const isDeleted = await apiDelete("/admin/users/:userId", { params: { userId: user._id.toString() } })
      .then((result) => Boolean(result?.ok))
      .catch(() => false)
    deleteModal.onClose()
    if (isDeleted) {
      toast({
        title: "Utilisateur supprimé",
      })
      onDelete?.()
    } else {
      toast({
        title: "Erreur lors de la suppression de l'utilisateur.",
        variant: "error",
        description: " Merci de réessayer plus tard",
      })
    }
  }

  const deactivateAccount = async () => {
    await deactivateUser("")
    deactivateModal.onClose()
    onUpdate?.()
  }

  const statusArray = (role?.status ?? []) as Jsonify<IRoleManagementEvent>[]
  const accessStatus = getLastStatusEvent(statusArray)?.status

  return (
    <>
      {user && (
        <>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "baseline", my: fr.spacing("2v") }}>
            <Box sx={{ width: "300px" }}>Type de compte </Box>
            <Box>ADMIN</Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "baseline", mb: fr.spacing("2v") }}>
            <Box sx={{ width: "300px" }}>Statut du compte </Box>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: fr.spacing("6v") }}>
              <Box> {accessStatus}</Box>
              {accessStatus !== AccessStatus.GRANTED && (
                <ActivateUserButton
                  onClick={async () => {
                    await activateUser()
                    onUpdate?.()
                  }}
                />
              )}
              {accessStatus !== AccessStatus.DENIED && <DisableUserButton onClick={deactivateModal.onOpen} />}
              <Box>
                <Button priority="secondary" onClick={deleteModal.onOpen}>
                  Supprimer l&apos;utilisateur
                </Button>
              </Box>
            </Box>
          </Box>
          <AdminConfirmationModal
            isOpen={deactivateModal.isOpen}
            onClose={deactivateModal.onClose}
            title="Désactivation du compte"
            confirmLabel="Désactiver le compte"
            onConfirm={deactivateAccount}
          >
            Vous êtes sur le point de désactiver le compte de {user.email}. Son accès sera coupé jusqu’à la réactivation du compte.
          </AdminConfirmationModal>
          <AdminConfirmationModal
            isOpen={deleteModal.isOpen}
            onClose={deleteModal.onClose}
            title="Suppression de l’utilisateur"
            confirmLabel="Supprimer l’utilisateur"
            onConfirm={deleteUser}
          >
            Vous êtes sur le point de supprimer définitivement l’utilisateur {user.email}. Cette action est irréversible.
          </AdminConfirmationModal>
        </>
      )}
      <UserFieldsForm user={user} onSubmit={onSubmit} type={parseEnum({ OPCO, ADMIN }, role?.authorized_type)} opco={parseEnum(OPCOS_LABEL, role?.authorized_id)} />
    </>
  )
}

const ActivateUserButton = ({ onClick }: { onClick: React.MouseEventHandler<HTMLButtonElement> }) => {
  return <Button onClick={onClick}>Activer le compte</Button>
}

const DisableUserButton = ({ onClick }: { onClick: React.MouseEventHandler<HTMLButtonElement> }) => {
  return <Button onClick={onClick}>Désactiver le compte</Button>
}

const UserFieldsForm = ({
  user,
  opco,
  type,
  onSubmit,
}: {
  user?: IUserWithAccountJson
  opco?: OPCOS_LABEL
  type?: typeof AUTHTYPE.ADMIN | typeof AUTHTYPE.OPCO
  onSubmit: (values: INewSuperUser, onEmailAlreadyUsed: (message: string) => void) => void
}) => {
  const formRef = useRef<HTMLFormElement>(null)
  const serverFieldErrors = useServerFieldErrors()
  const isCreation = !user
  const formik = useFormik({
    initialValues: {
      last_name: user?.last_name ?? "",
      first_name: user?.first_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      type: type ?? AUTHTYPE.OPCO,
      opco,
    },
    validationSchema: toFormikValidationSchema(buildAdminUserFormSchema(isCreation)),
    validate: serverFieldErrors.validate,
    enableReinitialize: true,
    // le champ affiche la valeur envoyée : sans changement de valeur initiale, enableReinitialize ne le remettrait pas à jour
    onSubmit: (submittedValues, { setFieldValue, setFieldError }) => {
      const phone = toSubmittedPhone(submittedValues.phone)
      setFieldValue("phone", phone, false)
      return onSubmit({ ...submittedValues, phone }, (message) => serverFieldErrors.setServerFieldError(setFieldError, "email", submittedValues.email, message))
    },
  })
  const { values, errors, touched, isSubmitting } = formik
  const opcoError = touched.opco && errors.opco

  return (
    <FormikProvider value={formik}>
      <form ref={formRef} onSubmit={createSubmitWithFocusOnError(formRef, formik)} noValidate>
        <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("2v"), alignItems: "baseline", my: fr.spacing("4v") }}>
          <p className={fr.cx("fr-text--sm", "fr-mb-0")}>Les champs marqués d’un astérisque (*) sont obligatoires.</p>
          {user && <Input disabled={true} label="Identifiant" nativeInputProps={{ type: "text", name: "id", value: user._id.toString() }} />}
          <Select
            label="Type de compte"
            nativeSelectProps={{
              onChange: async (event) => formik?.setFieldValue("type", event.target.value, true),
              name: "type",
              value: values.type,
              disabled: Boolean(user),
            }}
            style={{ minWidth: "300px", width: "100%", maxWidth: "400px" }}
          >
            <option value={AUTHTYPE.OPCO}>{AUTHTYPE.OPCO}</option>
            <option value={AUTHTYPE.ADMIN}>{AUTHTYPE.ADMIN}</option>
          </Select>

          {values.type === AUTHTYPE.OPCO && (
            <Select
              label={
                isCreation ? (
                  <>
                    OPCO <span aria-hidden="true">*</span>
                  </>
                ) : (
                  "OPCO"
                )
              }
              state={opcoError ? "error" : "default"}
              stateRelatedMessage={opcoError}
              nativeSelectProps={{
                onChange: async (event) => formik?.setFieldValue("opco", event.target.value || undefined, true),
                name: "opco",
                disabled: Boolean(user),
                required: isCreation,
                value: values.opco ?? "",
                "aria-invalid": Boolean(opcoError),
              }}
              style={{ textOverflow: "ellipsis", minWidth: "300px", width: "100%", maxWidth: "400px" }}
            >
              <option value="">Sélectionnez un OPCO</option>
              {Object.values(OPCOS_LABEL).map((opco) => (
                <option key={opco} value={opco}>
                  {opco}
                </option>
              ))}
            </Select>
          )}
          <CustomInput
            sx={{ minWidth: "300px", width: "100%", maxWidth: "400px" }}
            required={true}
            name="first_name"
            label="Prénom"
            type="text"
            autoComplete="off"
            value={values.first_name ?? ""}
          />
          <CustomInput
            sx={{ minWidth: "300px", width: "100%", maxWidth: "400px" }}
            required={true}
            name="last_name"
            label="Nom"
            type="text"
            autoComplete="off"
            value={values.last_name ?? ""}
          />
          <CustomInput
            sx={{ minWidth: "300px", width: "100%", maxWidth: "400px" }}
            required={true}
            name="email"
            label="E-mail"
            info={EMAIL_FORMAT_HINT}
            type="email"
            autoComplete="off"
            value={values.email ?? ""}
          />
          <CustomInput
            sx={{ minWidth: "300px", width: "100%", maxWidth: "400px" }}
            required={false}
            name="phone"
            label="Téléphone"
            info={PHONE_FORMAT_HINT}
            type="tel"
            autoComplete="off"
            value={values.phone ?? ""}
          />
          <Button type="submit" disabled={isSubmitting}>
            {user ? "Enregistrer" : "Créer l'utilisateur"}
          </Button>
        </Box>
      </form>
    </FormikProvider>
  )
}
