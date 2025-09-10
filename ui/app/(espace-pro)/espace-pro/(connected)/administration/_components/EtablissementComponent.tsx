import { Editable, EditableInput, EditablePreview, Tag, useToast } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { createRef, useEffect, useState } from "react"

import "react-dates/initialize"
import "react-dates/lib/css/_datepicker.css"

import { apiGet, apiPatch } from "@/utils/api.utils"

import { dayjs } from "../../../../../../common/dayjs"
import { Disquette } from "../../../../../../theme/components/icons"

const EtablissementComponent = ({ id }: { id?: string }) => {
  const emailGestionnaireFocusRef = createRef()
  const emailGestionnaireRef = createRef()

  const [etablissement, setEtablissement]: [any, (t: any) => void] = useState(undefined)
  const toast = useToast()

  const fetchData = async () => {
    try {
      const response = await apiGet("/admin/etablissements/:id", { params: { id } })
      setEtablissement(response ?? null)
    } catch (error) {
      toast({
        title: "Une erreur est survenue durant la récupération des informations.",
        status: "error",
        isClosable: true,
        position: "bottom-right",
      })
    }
  }

  /**
   * @description Returns toast common error for etablissement updates.
   * @return {string | number}
   */
  const putError = () =>
    toast({
      title: "Une erreur est survenue durant l'enregistrement.",
      status: "error",
      isClosable: true,
      position: "bottom-right",
    })

  /**
   * @description Call succes Toast.
   * @return {string | number}
   */
  const putSuccess = () =>
    toast({
      title: "Enregistrement effectué avec succès.",
      status: "success",
      isClosable: true,
      position: "bottom-right",
    })

  useEffect(() => {
    fetchData()
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [])

  /**
   * @description Upserts "gestionnaire_email"
   * @param {string} email
   * @return {Promise<void>}
   */
  const upsertEmailDecisionnaire = async (email: string) => {
    try {
      const response = await apiPatch("/admin/etablissements/:id", { params: { id: etablissement?._id }, body: { gestionnaire_email: email } })
      setEtablissement(response)
      putSuccess()
    } catch (error) {
      putError()
    }
  }

  if (etablissement === null) {
    return <Typography>Etablissement introuvable</Typography>
  }

  return (
    <Box sx={{ backgroundColor: "white", border: "1px solid #E0E5ED", borderRadius: "4px", mt: fr.spacing("5w"), pb: fr.spacing("2w") }}>
      <Box sx={{ borderBottom: "1px solid #E0E5ED" }}>
        <Typography sx={{ fontSize: "20px", fontWeight: 700, p: fr.spacing("2w") }}>Etablissement</Typography>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: 2, p: fr.spacing("2w") }}>
        <Box sx={{ width: "100%" }}>
          <Typography sx={{ fontWeight: 700 }}>
            Raison sociale <br />
            <br />
            <Typography component="span" sx={{ fontWeight: 400 }}>
              {etablissement?.raison_sociale}
            </Typography>
          </Typography>
        </Box>
        <Box sx={{ width: "100%" }}>
          <Typography sx={{ fontWeight: 700 }}>
            SIRET Formateur <br />
            <br />
            <Typography component="span" sx={{ fontWeight: 400 }}>
              {etablissement?.formateur_siret}
            </Typography>
          </Typography>
        </Box>
        <Box sx={{ width: "100%" }}>
          <Typography sx={{ fontWeight: 700 }}>
            SIRET Gestionnaire <br />
            <br />
            <Typography component="span" sx={{ fontWeight: 400 }}>
              {etablissement?.gestionnaire_siret}
            </Typography>
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: 2, p: fr.spacing("2w") }}>
        <Box sx={{ width: "100%" }}>
          <Typography sx={{ fontWeight: 700 }}>
            Adresse
            <br />
            <br />
            <Typography component="span" sx={{ fontWeight: 400 }}>
              {etablissement?.formateur_address}
            </Typography>
          </Typography>
        </Box>
        <Box sx={{ width: "100%" }}>
          <Typography sx={{ fontWeight: 700 }}>
            Code postal <br />
            <br />
            <Typography component="span" sx={{ fontWeight: 400 }}>
              {etablissement?.formateur_zip_code}
            </Typography>
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: 2, p: fr.spacing("2w") }}>
        {etablissement?.optout_invitation_date && (
          <Box sx={{ width: "100%" }}>
            <Typography sx={{ fontWeight: 700 }}>
              Date d'invitation à l'opt-out <br />
              <br />
              <Tag bg="#467FCF" size="md" color="white">
                {dayjs(etablissement?.optout_invitation_date).format("DD/MM/YYYY")}
              </Tag>
            </Typography>
          </Box>
        )}
        {etablissement?.optout_activation_date && (
          <Box sx={{ width: "100%" }}>
            <Typography sx={{ fontWeight: 700 }}>
              Date d'activation des formations
              <br />
              <br />
              <Tag bg="#467FCF" size="md" color="white">
                {dayjs(etablissement?.optout_activation_date).format("DD/MM/YYYY")}
              </Tag>
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: 2, p: fr.spacing("2w") }}>
        {etablissement?.optout_refusal_date && (
          <Box sx={{ width: "100%" }}>
            <Typography sx={{ fontWeight: 700 }}>
              Date de refus de l'opt-out
              <br />
              <br />
              <Tag bg="#467FCF" size="md" color="white">
                {dayjs(etablissement?.optout_refusal_date).format("DD/MM/YYYY")}
              </Tag>
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ p: fr.spacing("2w") }}>
        {/*  @ts-expect-error: TODO */}
        <Box onClick={() => emailGestionnaireFocusRef.current.focus()}>
          <Typography sx={{ fontWeight: 700 }}>
            Email décisionnaire <br />
            <br />
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Editable
              defaultValue={etablissement?.gestionnaire_email}
              key={etablissement?.gestionnaire_email || "gestionnaire_email"}
              style={{
                border: "solid #dee2e6 1px",
                padding: 5,
                marginRight: 10,
                borderRadius: 4,
                minWidth: "70%",
              }}
            >
              {/*  @ts-expect-error: TODO */}
              <EditablePreview ref={emailGestionnaireFocusRef} />
              {/*  @ts-expect-error: TODO */}
              <EditableInput ref={emailGestionnaireRef} type="email" _focus={{ border: "none" }} />
            </Editable>
            <Box>
              {/*  @ts-expect-error: TODO */}
              <Button onClick={() => upsertEmailDecisionnaire(emailGestionnaireRef.current.value.toLowerCase())}>
                <Disquette w="16px" h="16px" />
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default EtablissementComponent
