import { Box, Button, FormControl, FormLabel, HStack, Input, VStack, useToast } from "@chakra-ui/react"
import { FormikProvider, useFormik } from "formik"
import { getLastStatusEvent } from "shared"
import { AccessStatus, IRoleManagementEvent, IRoleManagementJson } from "shared/models/roleManagement.model"
import { IUser2Json } from "shared/models/user2.model"
import * as Yup from "yup"

import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"
import { createAdminUser } from "@/utils/api"
import { apiDelete, apiPut } from "@/utils/api.utils"

import CustomInput from "../../CustomInput"

export const AdminUserForm = ({
  user,
  role,
  onCreate,
  onDelete,
  onUpdate,
}: {
  user?: IUser2Json
  role?: IRoleManagementJson
  onCreate?: (result: void, error?: any) => void
  onDelete?: () => void
  onUpdate?: () => void
}) => {
  const toast = useToast()
  const { activate: activateUser, deactivate: deactivateUser } = useUserPermissionsActions(user?._id.toString())
  const formik = useFormik({
    initialValues: {
      last_name: user?.last_name || "",
      first_name: user?.first_name || "",
      email: user?.email || "",
      phone: user?.phone || "Non renseigné",
    },
    validationSchema: Yup.object().shape({
      last_name: Yup.string().required("Votre nom est obligatoire"),
      first_name: Yup.string().required("Votre prénom est obligatoire"),
      email: Yup.string().email("Format d'email invalide").required("Votre email est obligatoire"),
      phone: Yup.string(),
    }),
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      let result
      let error

      try {
        if (user) {
          result = await apiPut("/admin/users/:userId", {
            params: { userId: user._id.toString() },
            body: values,
          })
          if (result?.ok) {
            toast({
              title: "Utilisateur mis à jour",
              status: "success",
              isClosable: true,
            })
          } else {
            toast({
              title: "Erreur lors de la mise à jour de l'utilisateur.",
              status: "error",
              isClosable: true,
              description: " Merci de réessayer plus tard",
            })
          }
          onUpdate?.()
        } else {
          result = await createAdminUser(values).catch((err) => {
            if (err.statusCode === 409) {
              return { error: "Cet utilisateur existe déjà" }
            }
          })
          if (result?._id) {
            toast({
              title: "Utilisateur créé",
              status: "success",
              isClosable: true,
            })
            onCreate?.(result)
          } else if (result?.error) {
            error = toast({
              title: result.error,
              status: "error",
              isClosable: true,
            })
          } else {
            error = "Erreur lors de la création de l'utilisateur."
            toast({
              title: error,
              status: "error",
              isClosable: true,
              description: " Merci de réessayer plus tard",
            })
          }
        }
      } catch (e) {
        error = e
        console.error(e)
        const response = await (e?.json ?? {})
        const message = response?.message ?? e?.message
        toast({
          title: message,
          status: "error",
          isClosable: true,
        })
      }
      setSubmitting(false)
    },
  })
  const { values, dirty, handleSubmit } = formik

  const onDeleteClicked = async (event) => {
    event.preventDefault()
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      const result = (await apiDelete("/admin/users/:userId", { params: { userId: user._id.toString() }, querystring: {} })) as any
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

  const statusArray: IRoleManagementEvent[] = role?.status
  const accessStatus = getLastStatusEvent(statusArray)?.status

  return (
    <>
      {user && (
        <>
          <HStack mb={4} alignItems="baseline">
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
      <FormikProvider value={formik}>
        <form onSubmit={handleSubmit}>
          <VStack gap={2} alignItems="baseline" my={8}>
            {user && (
              <FormControl py={2}>
                <FormLabel>Identifiant</FormLabel>
                <Input type="text" id="id" name="id" value={user._id.toString()} disabled />
              </FormControl>
            )}
            <CustomInput required={true} name="first_name" label="Prénom" type="text" value={values.first_name} />
            <CustomInput required={true} name="last_name" label="Nom" type="text" value={values.last_name} />
            <CustomInput required={true} name="email" label="Email" type="email" value={values.email} />
            <CustomInput required={false} name="phone" label="Téléphone" type="phone" value={values.phone} />
            <Box paddingTop={10}>
              <Button type="submit" variant="primary" mr={5} isDisabled={!dirty}>
                {user ? "Enregistrer" : "Créer l'utilisateur"}
              </Button>
            </Box>
          </VStack>
        </form>
      </FormikProvider>
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
