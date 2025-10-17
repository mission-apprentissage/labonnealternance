import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box } from "@mui/material"
import { FormikProvider, useFormik } from "formik"
import { SyntheticEvent } from "react"
import { AccessStatus, IRoleManagementEvent, IRoleManagementJson, getLastStatusEvent, parseEnum } from "shared"
import { OPCOS_LABEL } from "shared/constants/index"
import { AUTHTYPE } from "shared/constants/recruteur"
import { INewSuperUser, IUserWithAccountJson, ZNewSuperUser, ZUserWithAccountFields } from "shared/models/userWithAccount.model"
import { Jsonify } from "type-fest"
import { toFormikValidationSchema } from "zod-formik-adapter"

import CustomInput from "@/app/_components/CustomInput"
import { useToast } from "@/app/hooks/useToast"
import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"
import { createSuperUser, updateUser } from "@/utils/api"
import { ApiError, apiDelete } from "@/utils/api.utils"

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
  const { activate: activateUser, deactivate: deactivateUser } = useUserPermissionsActions(user?._id.toString())

  const errorHandler = (error: any) => {
    if (error && error instanceof ApiError && error.context?.statusCode >= 400) {
      error = error.context.message
    }
    toast({
      title: error + "",
      variant: "error",
    })
  }

  const onSubmit = async (values: INewSuperUser) => {
    if (user) {
      const { email, first_name, last_name, phone = "" } = values
      updateUser(user._id.toString(), { email, first_name, last_name, phone })
        .then(() => {
          toast({
            title: "Utilisateur mis à jour",
          })
          onUpdate?.()
        })
        .catch(errorHandler)
    } else {
      const { email, first_name, last_name, phone = "", type } = values
      const commonFields = { email, first_name, last_name, phone, type }
      const sentFields = { ...commonFields, ...(type === OPCO ? { opco: values.opco } : {}) }
      /* @ts-ignore TODO */
      createSuperUser(sentFields)
        .then((user) => {
          toast({
            title: "Utilisateur créé",
          })
          onCreate?.(user._id.toString())
        })
        .catch(errorHandler)
    }
  }

  const onDeleteClicked = async (event: SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      const result = await apiDelete("/admin/users/:userId", { params: { userId: user._id.toString() }, querystring: {} })
      if (result?.ok) {
        toast({
          title: "Utilisateur supprimé",
        })
      } else {
        toast({
          title: "Erreur lors de la suppression de l'utilisateur.",
          variant: "error",
          description: " Merci de réessayer plus tard",
        })
      }

      return onDelete?.()
    }
  }

  const statusArray: Jsonify<IRoleManagementEvent>[] = role?.status
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
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: 3 }}>
              <Box> {accessStatus}</Box>
              {accessStatus !== AccessStatus.GRANTED && (
                <ActivateUserButton
                  onClick={async () => {
                    await activateUser()
                    onUpdate?.()
                  }}
                />
              )}
              {accessStatus !== AccessStatus.DENIED && (
                <DisableUserButton
                  onClick={async () => {
                    await deactivateUser("")
                    onUpdate?.()
                  }}
                />
              )}
              <Box>
                <Button priority="secondary" onClick={onDeleteClicked}>
                  Supprimer l&apos;utilisateur
                </Button>
              </Box>
            </Box>
          </Box>
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
  onSubmit: (values: INewSuperUser) => void
}) => {
  const zodSchema = user ? ZUserWithAccountFields : ZNewSuperUser
  const formik = useFormik({
    initialValues: {
      last_name: user?.last_name ?? "",
      first_name: user?.first_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      type: type ?? AUTHTYPE.OPCO,
      opco,
    },
    validationSchema: toFormikValidationSchema(zodSchema),
    enableReinitialize: true,
    onSubmit,
  })
  const { values, dirty, handleSubmit, isValid } = formik

  return (
    <FormikProvider value={formik}>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "baseline", my: fr.spacing("2w") }}>
          {user && <Input disabled={true} label="Identifiant" nativeInputProps={{ type: "text", name: "id", value: user._id.toString() }} />}
          <Select
            label="Type de compte"
            nativeSelectProps={{
              onChange: (event) => formik?.setFieldValue("type", event.target.value, true),
              name: "type",
              disabled: Boolean(user),
            }}
            style={{ minWidth: "300px", width: "100%", maxWidth: "400px" }}
          >
            <option value={AUTHTYPE.OPCO}>{AUTHTYPE.OPCO}</option>
            <option value={AUTHTYPE.ADMIN}>{AUTHTYPE.ADMIN}</option>
          </Select>

          {values.type === AUTHTYPE.OPCO && (
            <Select
              label="OPCO"
              nativeSelectProps={{
                onChange: (event) => formik?.setFieldValue("opco", event.target.value, true),
                name: "opco",
                disabled: Boolean(user),
                value: values.opco,
              }}
              style={{ textOverflow: "ellipsis", minWidth: "300px", width: "100%", maxWidth: "400px" }}
            >
              <option value={AUTHTYPE.OPCO}>{AUTHTYPE.OPCO}</option>
              <option value={AUTHTYPE.ADMIN}>{AUTHTYPE.ADMIN}</option>
              {Object.values(OPCOS_LABEL).map((opco) => (
                <option key={opco} value={opco}>
                  {opco}
                </option>
              ))}
            </Select>
          )}
          <CustomInput sx={{ minWidth: "300px", width: "100%", maxWidth: "400px" }} required={true} name="first_name" label="Prénom" type="text" value={values.first_name ?? ""} />
          <CustomInput sx={{ minWidth: "300px", width: "100%", maxWidth: "400px" }} required={true} name="last_name" label="Nom" type="text" value={values.last_name ?? ""} />
          <CustomInput sx={{ minWidth: "300px", width: "100%", maxWidth: "400px" }} required={true} name="email" label="Email" type="email" value={values.email ?? ""} />
          <CustomInput sx={{ minWidth: "300px", width: "100%", maxWidth: "400px" }} required={false} name="phone" label="Téléphone" type="phone" value={values.phone ?? ""} />
          <Button type="submit" disabled={!dirty || !isValid}>
            {user ? "Enregistrer" : "Créer l'utilisateur"}
          </Button>
        </Box>
      </form>
    </FormikProvider>
  )
}
