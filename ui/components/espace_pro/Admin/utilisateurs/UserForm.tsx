import { Box, Button, FormControl, FormLabel, FormErrorMessage, HStack, Input, Text, VStack, useToast, Checkbox } from "@chakra-ui/react"
import { useFormik } from "formik"
import React from "react"
import * as Yup from "yup"

import { apiDelete, apiPost, apiPut } from "@/utils/api.utils"

// import { USER_STATUS_LABELS } from "@/common/constants/usersConstants";

// type: Type,
// is_email_checked: Email_valide,
//   status: [
//     {
//       status: "VALIDÉ",
//       validation_type: "AUTOMATIQUE",
//       user: "SERVEUR",
//     },
//   ],
// },
const UserForm = ({ user, onCreate, onDelete, onUpdate }: { user: any; onCreate?: any; onDelete?: any; onUpdate?: any }) => {
  const toast = useToast()
  const { values, errors, touched, dirty, handleSubmit, handleChange } = useFormik({
    initialValues: {
      nom: user?.last_name || "",
      prenom: user?.first_name || "",
      email: user?.email || "",
      telephone: user?.phone || "Non renseigné",
      beAdmin: user?.type === "ADMIN" || false,
      scope: user?.scope || "all",
      establishment_siret: user?.establishment_siret || "13002526500013",
      establishment_raison_sociale: user?.establishment_raison_sociale || "beta.gouv (Dinum)",
    },
    validationSchema: Yup.object().shape({
      nom: Yup.string().required("Votre nom est obligatoire"),
      prenom: Yup.string().required("Votre prénom est obligatoire"),
      email: Yup.string().email("Format d'email invalide").required("Votre email est obligatoire"),
      telephone: Yup.string(),
      beAdmin: Yup.boolean().required("Vous devez cocher cette case"),
      scope: Yup.string().required("obligatoire"),
      establishment_siret: Yup.string().required("obligatoire"),
      establishment_raison_sociale: Yup.string().required("obligatoire"),
    }),
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      let result
      let error

      try {
        if (user) {
          result = await apiPut("/admin/users/:userId", { params: { userId: user._id }, body: values })
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
        } else {
          result = await apiPost("/admin/users", { body: values }).catch((err) => {
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

  const onDeleteClicked = async (e) => {
    e.preventDefault()
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      const result = (await apiDelete("/admin/users/:userId", { params: { userId: user._id as string }, querystring: {} })) as any
      console.log(result)
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

  const confirmUserAccess = async (validate) => {
    if (!confirm(`Voulez-vous vraiment ${validate ? "valider" : "rejeter"} l'accès de cet utilisateur sur l'organisation ${user.organisation.label}? ?`)) {
      return
    }
    try {
      // await _put(`/api/v1/admin/users/${user._id}/${validate ? "validate" : "reject"}`)
      // await apiPut("/admin/users/:userId", { params: { userId: user._id }, body })
      toast({
        title: `L'utilisateur a été ${validate ? "validé" : "rejeté"}.`,
        status: "success",
        isClosable: true,
      })
      validate ? onUpdate?.() : onDelete?.()
    } catch (e) {
      console.error(e)
      toast({
        title: "Erreur lors de la validation de l'accès.",
        status: "error",
        isClosable: true,
        description: " Merci de réessayer plus tard",
      })
    }
  }

  const resendConfirmationEmail = async () => {
    try {
      // await _post(`/api/v1/admin/users/${user._id}/resend-confirmation-email`)
      toast({
        title: "L'email de confirmation a été renvoyé.",
        status: "success",
        isClosable: true,
      })
    } catch (e) {
      console.error(e)
      toast({
        title: "Erreur lors de l'envoi de l'email.",
        status: "error",
        isClosable: true,
        description: "Merci de réessayer plus tard",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <VStack gap={2} alignItems="baseline" my={8}>
        <FormControl py={2} isInvalid={!!errors.nom}>
          <FormLabel>Nom</FormLabel>
          <Input type="text" id="nom" name="nom" value={values.nom} onChange={handleChange} />
          {errors.nom && touched.nom && <FormErrorMessage>{errors.nom as string}</FormErrorMessage>}
        </FormControl>
        <FormControl py={2} isInvalid={!!errors.prenom}>
          <FormLabel>Prénom</FormLabel>
          <Input type="text" id="prenom" name="prenom" value={values.prenom} onChange={handleChange} />
          {errors.prenom && touched.prenom && <FormErrorMessage>{errors.prenom as string}</FormErrorMessage>}
        </FormControl>
        <FormControl py={2} isInvalid={!!errors.email} isRequired>
          <FormLabel>Email</FormLabel>
          <Input type="email" id="email" name="email" value={values.email} onChange={handleChange} />
          {errors.email && touched.email && <FormErrorMessage>{errors.email as string}</FormErrorMessage>}
        </FormControl>
        <FormControl py={2} isInvalid={!!errors.telephone}>
          <FormLabel>Téléphone</FormLabel>
          <Input type="telephone" id="telephone" name="telephone" value={values.telephone} onChange={handleChange} />
          {errors.telephone && touched.telephone && <FormErrorMessage>{errors.telephone as string}</FormErrorMessage>}
        </FormControl>
        <FormControl py={2} isInvalid={!!errors.establishment_siret}>
          <FormLabel>Siret</FormLabel>
          <Input type="establishment_siret" id="establishment_siret" name="establishment_siret" value={values.establishment_siret} onChange={handleChange} />
          {errors.establishment_siret && touched.establishment_siret && <FormErrorMessage>{errors.establishment_siret as string}</FormErrorMessage>}
        </FormControl>
        <FormControl py={2} isInvalid={!!errors.establishment_raison_sociale}>
          <FormLabel>Siret</FormLabel>
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
        <FormControl my={6} isRequired isInvalid={!!errors.beAdmin}>
          <Checkbox type="beAdmin" id="beAdmin" name="beAdmin" onChange={handleChange} size="lg" isChecked={values.beAdmin}>
            Admin
          </Checkbox>
          {errors.beAdmin && touched.beAdmin && <FormErrorMessage>{errors.beAdmin as string}</FormErrorMessage>}
        </FormControl>

        {user && (
          <>
            <HStack spacing={5}>
              <Text as="span">Statut du compte</Text>
              <Text as="span" bgColor="galt2">
                {/* {USER_STATUS_LABELS[user.account_status] || user.account_status} */}
              </Text>

              <HStack spacing={5}>
                {user.account_status === "PENDING_EMAIL_VALIDATION" && (
                  <HStack spacing={8} alignSelf="start">
                    <Button type="button" variant="primary" onClick={() => resendConfirmationEmail()}>
                      Renvoyer l’email de confirmation
                    </Button>
                  </HStack>
                )}
              </HStack>
            </HStack>

            <HStack spacing={5}>
              <Text as="span">Type de compte</Text>
              <Text as="span" bgColor="galtDark" px={2}>
                {user.organisation.label}
              </Text>

              <HStack spacing={5}>
                {user.account_status !== "CONFIRMED" && (
                  <HStack spacing={8} alignSelf="start">
                    <Button type="button" variant="primary" onClick={() => confirmUserAccess(true)}>
                      Confirmer
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => confirmUserAccess(false)}>
                      Rejeter
                    </Button>
                  </HStack>
                )}
              </HStack>
            </HStack>
          </>
        )}

        {user ? (
          <Box paddingTop={10}>
            <Button type="submit" variant="primary" mr={5} isDisabled={!dirty}>
              Enregistrer
            </Button>
            <Button variant="outline" colorScheme="red" borderRadius="none" onClick={onDeleteClicked}>
              Supprimer l&apos;utilisateur
            </Button>
          </Box>
        ) : (
          <Button type="submit" variant="primary">
            Créer l&apos;utilisateur
          </Button>
        )}
      </VStack>
    </form>
  )
}

export default UserForm
