import { Box, Button, FormControl, FormLabel, HStack, Input, VStack, useToast } from "@chakra-ui/react"
import { FormikProvider, useFormik } from "formik"
import { AccessStatus, IRoleManagementEvent, IRoleManagementJson, getLastStatusEvent, parseEnum } from "shared"
import { OPCOS_LABEL } from "shared/constants/index"
import { AUTHTYPE } from "shared/constants/recruteur"
import { INewSuperUser, IUserWithAccountJson, ZNewSuperUser, ZUserWithAccountFields } from "shared/models/userWithAccount.model"
import { Jsonify } from "type-fest"
import { toFormikValidationSchema } from "zod-formik-adapter"

import CustomInput from "@/app/(espace-pro)/_components/CustomInput"
import { CustomSelect } from "@/app/(espace-pro)/_components/CustomSelect"
import { CustomFormControl } from "@/app/_components/CustomFormControl"
import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"
import { createSuperUser, updateUser } from "@/utils/api"
import { apiDelete, ApiError } from "@/utils/api.utils"

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
      status: "error",
      isClosable: true,
    })
  }

  const onSubmit = async (values: INewSuperUser) => {
    if (user) {
      const { email, first_name, last_name, phone = "" } = values
      updateUser(user._id.toString(), { email, first_name, last_name, phone })
        .then(() => {
          toast({
            title: "Utilisateur mis à jour",
            status: "success",
            isClosable: true,
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
            status: "success",
            isClosable: true,
          })
          onCreate?.(user._id.toString())
        })
        .catch(errorHandler)
    }
  }

  const onDeleteClicked = async (event) => {
    event.preventDefault()
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      const result = await apiDelete("/admin/users/:userId", { params: { userId: user._id.toString() }, querystring: {} })
      if (result?.ok) {
        toast({
          title: "Utilisateur supprimé",
          status: "success",
          isClosable: true,
        })
      } else {
        toast({
          title: "Erreur lors de la suppression de l'utilisateur.",
          status: "error",
          isClosable: true,
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
          <HStack mt={4} mb={4} alignItems="baseline">
            <Box w="300px">Type de compte </Box>
            <Box>ADMIN</Box>
          </HStack>
          <HStack mb={4} alignItems="baseline">
            <Box w="300px">Statut du compte </Box>=
            <HStack spacing={6}>
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
                <Button variant="outline" colorScheme="red" borderRadius="none" onClick={onDeleteClicked}>
                  Supprimer l&apos;utilisateur
                </Button>
              </Box>
            </HStack>
          </HStack>
        </>
      )}
      <UserFieldsForm user={user} onSubmit={onSubmit} type={parseEnum({ OPCO, ADMIN }, role?.authorized_type)} opco={parseEnum(OPCOS_LABEL, role?.authorized_id)} />
    </>
  )
}

const ActivateUserButton = ({ onClick }) => {
  return (
    <Button variant="primary" onClick={onClick}>
      Activer le compte
    </Button>
  )
}

const DisableUserButton = ({ onClick }) => {
  return (
    <Button variant="primary-red" onClick={onClick}>
      Désactiver le compte
    </Button>
  )
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
        <VStack gap={2} alignItems="baseline" my={8}>
          {user && (
            <FormControl py={2}>
              <FormLabel>Identifiant</FormLabel>
              <Input type="text" id="id" name="id" value={user._id.toString()} disabled />
            </FormControl>
          )}
          <CustomFormControl name="type" label="Type de compte">
            <CustomSelect
              name="type"
              possibleValues={[AUTHTYPE.OPCO, AUTHTYPE.ADMIN]}
              value={values.type}
              onChange={(newValue) => formik?.setFieldValue("type", newValue, true)}
              dataTestId="select-type"
              selectProps={{
                isDisabled: Boolean(user),
              }}
            />
          </CustomFormControl>
          {values.type === AUTHTYPE.OPCO && (
            <CustomFormControl name="opco" label="OPCO">
              <CustomSelect
                name="opco"
                possibleValues={Object.values(OPCOS_LABEL)}
                value={values.opco}
                onChange={(newValue) => formik?.setFieldValue("opco", newValue, true)}
                dataTestId="select-opco"
                selectProps={{
                  isDisabled: Boolean(user),
                }}
              />
            </CustomFormControl>
          )}
          <CustomInput required={true} name="first_name" label="Prénom" type="text" value={values.first_name ?? ""} />
          <CustomInput required={true} name="last_name" label="Nom" type="text" value={values.last_name ?? ""} />
          <CustomInput required={true} name="email" label="Email" type="email" value={values.email ?? ""} />
          <CustomInput required={false} name="phone" label="Téléphone" type="phone" value={values.phone ?? ""} />
          <Box paddingTop={10}>
            <Button type="submit" variant="primary" mr={5} isDisabled={!dirty || !isValid}>
              {user ? "Enregistrer" : "Créer l'utilisateur"}
            </Button>
          </Box>
        </VStack>
      </form>
    </FormikProvider>
  )
}
