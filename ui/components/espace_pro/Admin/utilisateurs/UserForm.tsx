import { Box, Button, Checkbox, FormControl, FormErrorMessage, FormLabel, HStack, Input, VStack, useDisclosure, useToast } from "@chakra-ui/react"
import { useFormik } from "formik"
import { IUserRecruteurJson } from "shared"
import { AccessStatus } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"
import * as Yup from "yup"

import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"
import { createUser } from "@/utils/api"
import { apiDelete, apiPut } from "@/utils/api.utils"

import ConfirmationDesactivationUtilisateur from "../../ConfirmationDesactivationUtilisateur"

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

const ActionButtons = ({ currentStatus, onDisableUser, onActivateUser }: { currentStatus: AccessStatus; onDisableUser: () => void; onActivateUser: () => void }) => {
  return (
    <>
      {currentStatus !== AccessStatus.GRANTED && <ActivateUserButton onClick={onActivateUser} />}
      {currentStatus !== AccessStatus.DENIED && <DisableUserButton onClick={onDisableUser} />}
    </>
  )
}

const UserForm = ({
  user,
  onCreate,
  onDelete,
  onUpdate,
}: {
  user: IUserRecruteurJson
  onCreate?: (result: void, error?: any) => void
  onDelete?: () => void
  onUpdate?: () => void
}) => {
  const toast = useToast()
  const confirmationDesactivationUtilisateur = useDisclosure()
  const { activate: activateUser } = useUserPermissionsActions(user._id.toString(), organizationId, user.type)
  const { values, errors, touched, dirty, handleSubmit, handleChange } = useFormik({
    initialValues: {
      last_name: user?.last_name || "",
      first_name: user?.first_name || "",
      email: user?.email || "",
      phone: user?.phone || "Non renseigné",
      beAdmin: user?.type === "ADMIN" || false,
      type: user?.type || "",
      scope: user?.scope || "all",
      establishment_siret: user?.establishment_siret || "13002526500013",
      establishment_raison_sociale: user?.establishment_raison_sociale || "beta.gouv (Dinum)",
    },
    validationSchema: Yup.object().shape({
      last_name: Yup.string().required("Votre nom est obligatoire"),
      first_name: Yup.string().required("Votre prénom est obligatoire"),
      email: Yup.string().email("Format d'email invalide").required("Votre email est obligatoire"),
      phone: Yup.string(),
      beAdmin: Yup.boolean().required("Vous devez cocher cette case"),
      type: Yup.string(),
      scope: Yup.string().required("obligatoire"),
      establishment_siret: Yup.string().required("obligatoire"),
      establishment_raison_sociale: Yup.string().required("obligatoire"),
    }),
    enableReinitialize: true,
    onSubmit: async ({ beAdmin, ...values }, { setSubmitting }) => {
      let result
      let error

      try {
        if (user) {
          result = await apiPut("/admin/users/:userId", {
            params: { userId: user._id.toString() },
            body: {
              ...values,
              type: beAdmin ? "ADMIN" : values.type,
            },
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
          result = await createUser({
            ...values,
            type: beAdmin ? "ADMIN" : values.type,
          }).catch((err) => {
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

  const onDeleteClicked = async (event) => {
    event.preventDefault()
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      const result = (await apiDelete("/admin/users/:userId", { params: { userId: user._id as string }, querystring: {} })) as any
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

  const accessStatus = getLastStatusEvent(user?.status ?? [])?.status

  return (
    <>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={user} onUpdate={onUpdate} />
      {user && (
        <>
          <HStack mb={4} alignItems="baseline">
            <Box w="300px">Type de compte </Box>
            <Box>{user.type}</Box>
          </HStack>
          <HStack mb={4} alignItems="baseline">
            <Box w="300px">Statut du compte </Box>=
            <HStack spacing={6}>
              <Box> {accessStatus}</Box>
              <ActionButtons
                currentStatus={accessStatus}
                onDisableUser={() => confirmationDesactivationUtilisateur.onOpen()}
                onActivateUser={() => {
                  activateUser()
                  onUpdate?.()
                }}
              />{" "}
              <Box>
                <Button variant="outline" colorScheme="red" borderRadius="none" onClick={onDeleteClicked}>
                  Supprimer l&apos;utilisateur
                </Button>
              </Box>
            </HStack>
          </HStack>
        </>
      )}
      <form onSubmit={handleSubmit}>
        <VStack gap={2} alignItems="baseline" my={8}>
          {user && (
            <FormControl py={2}>
              <FormLabel>Identifiant</FormLabel>
              <Input type="text" id="id" name="id" value={user._id.toString()} disabled />
            </FormControl>
          )}
          <FormControl py={2} isInvalid={!!errors.first_name}>
            <FormLabel>Prénom</FormLabel>
            <Input type="text" id="first_name" name="first_name" value={values.first_name} onChange={handleChange} />
            {errors.first_name && touched.first_name && <FormErrorMessage>{errors.first_name as string}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} isInvalid={!!errors.last_name}>
            <FormLabel>Nom</FormLabel>
            <Input type="text" id="last_name" name="last_name" value={values.last_name} onChange={handleChange} />
            {errors.last_name && touched.last_name && <FormErrorMessage>{errors.last_name as string}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} isInvalid={!!errors.email} isRequired>
            <FormLabel>Email</FormLabel>
            <Input type="email" id="email" name="email" value={values.email} onChange={handleChange} />
            {errors.email && touched.email && <FormErrorMessage>{errors.email as string}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} isInvalid={!!errors.phone}>
            <FormLabel>Téléphone</FormLabel>
            <Input type="phone" id="phone" name="phone" value={values.phone} onChange={handleChange} />
            {errors.phone && touched.phone && <FormErrorMessage>{errors.phone as string}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} isInvalid={!!errors.establishment_siret}>
            <FormLabel>Siret</FormLabel>
            <Input type="establishment_siret" id="establishment_siret" name="establishment_siret" value={values.establishment_siret} onChange={handleChange} />
            {errors.establishment_siret && touched.establishment_siret && <FormErrorMessage>{errors.establishment_siret as string}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} isInvalid={!!errors.establishment_raison_sociale}>
            <FormLabel>Raison sociale</FormLabel>
            <Input
              type="establishment_raison_sociale"
              id="establishment_raison_sociale"
              name="establishment_raison_sociale"
              value={values.establishment_raison_sociale}
              onChange={handleChange}
            />
            {errors.establishment_raison_sociale && touched.establishment_raison_sociale && <FormErrorMessage>{errors.establishment_raison_sociale as string}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} isInvalid={!!errors.scope}>
            <FormLabel>scope</FormLabel>
            <Input type="scope" id="scope" name="scope" value={values.scope} onChange={handleChange} />
            {errors.scope && touched.scope && <FormErrorMessage>{errors.scope as string}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} isInvalid={!!errors.type} isDisabled={values.beAdmin}>
            <FormLabel>type</FormLabel>
            <Input type="type" id="type" name="type" value={values.type} onChange={handleChange} />
            {errors.type && touched.type && <FormErrorMessage>{errors.type as string}</FormErrorMessage>}
          </FormControl>
          <FormControl my={6} isRequired isInvalid={!!errors.beAdmin}>
            <Checkbox type="beAdmin" id="beAdmin" name="beAdmin" onChange={handleChange} size="lg" isChecked={values.beAdmin}>
              Administrateur
            </Checkbox>
            {errors.beAdmin && touched.beAdmin && <FormErrorMessage>{errors.beAdmin as string}</FormErrorMessage>}
          </FormControl>

          {user ? (
            <Box paddingTop={10}>
              <Button type="submit" variant="primary" mr={5} isDisabled={!dirty}>
                Enregistrer
              </Button>
            </Box>
          ) : (
            <Button type="submit" variant="primary">
              Créer l&apos;utilisateur
            </Button>
          )}
        </VStack>
      </form>
    </>
  )
}

export default UserForm
