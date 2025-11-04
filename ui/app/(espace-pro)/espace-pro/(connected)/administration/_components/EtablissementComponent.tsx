import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Input, Typography } from "@mui/material"
import { createRef, useEffect, useState } from "react"

import "react-dates/initialize"
import "react-dates/lib/css/_datepicker.css"

import { dayjs } from "@/common/dayjs"
import LbaBadge from "@/app/(espace-pro)/_components/Badge"
import { useToast } from "@/app/hooks/useToast"
import { apiGet, apiPatch } from "@/utils/api.utils"

import { Disquette } from "@/theme/components/icons"

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
        variant: "error",
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
      variant: "error",
    })

  /**
   * @description Call succes Toast.
   * @return {string | number}
   */
  const putSuccess = () =>
    toast({
      title: "Enregistrement effectué avec succès.",
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
              <LbaBadge variant="neutral">{dayjs(etablissement?.optout_invitation_date).format("DD/MM/YYYY")}</LbaBadge>
            </Typography>
          </Box>
        )}
        {etablissement?.optout_activation_date && (
          <Box sx={{ width: "100%" }}>
            <Typography sx={{ fontWeight: 700 }}>
              Date d'activation des formations
              <br />
              <br />
              <LbaBadge variant="neutral">{dayjs(etablissement?.optout_activation_date).format("DD/MM/YYYY")}</LbaBadge>
            </Typography>
          </Box>
        )}
      </Box>
      {etablissement?.optout_refusal_date && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }, gap: 2, p: fr.spacing("2w") }}>
          <Box sx={{ width: "100%" }}>
            <Typography sx={{ fontWeight: 700 }}>
              Date de refus de l'opt-out
              <br />
              <br />
              <LbaBadge variant="neutral">{dayjs(etablissement?.optout_refusal_date).format("DD/MM/YYYY")}</LbaBadge>
            </Typography>
          </Box>
        </Box>
      )}
      <Box sx={{ p: fr.spacing("2w") }}>
        {/*  @ts-expect-error: TODO */}
        <Box onClick={() => emailGestionnaireFocusRef.current.focus()}>
          <Typography sx={{ fontWeight: 700 }}>
            Email décisionnaire <br />
            <br />
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Input
              sx={{ fontSize: "12px", maxWidth: "400px", width: "100%" }}
              className={fr.cx("fr-input")}
              inputRef={emailGestionnaireRef}
              defaultValue={etablissement?.gestionnaire_email}
              type="email"
            />
            <Box sx={{ ml: 1 }}>
              {/*  @ts-expect-error: TODO */}
              <Button onClick={async () => upsertEmailDecisionnaire(emailGestionnaireRef.current.value.toLowerCase())}>
                <Disquette sx={{ width: "16px", height: "16px" }} />
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default EtablissementComponent
