"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { Form, Formik } from "formik"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import type { IFormationCatalogueJson } from "shared"
import { z } from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import CustomDSFRInput from "@/app/_components/CustomDSFRInput"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"
import { useToast } from "@/app/hooks/useToast"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

const KEYWORD_REQUIRED_ERROR = "Saisissez un SIRET, un UAI, une clé ministère éducatif ou un identifiant RCO"

const ZSearchForm = z.object({
  keyword: z.string({ error: KEYWORD_REQUIRED_ERROR }).trim().min(1, KEYWORD_REQUIRED_ERROR),
})

export default function RendezVousApprentissage() {
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const toast = useToast()

  const search = async (values) => {
    const { keyword } = values
    setLoading(true)
    try {
      const keywordEncoded = encodeURIComponent(keyword)
      const formations: IFormationCatalogueJson[] = await apiGet("/admin/formations", { querystring: { search_item: keywordEncoded } })

      if (!formations.length) {
        toast({ title: "Aucun établissement trouvé dans le catalogue.", variant: "info" })
      } else {
        router.push(PAGES.dynamic.rendezVousApprentissageDetail({ siret: formations[0].etablissement_formateur_siret }).getPath())
      }
    } catch (_e) {
      toast({ title: "Une erreur est survenue pendant la recherche.", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Breadcrumb pages={[PAGES.static.rendezVousApprentissageRecherche]} />
      <Box sx={{ border: "1px solid #E0E5ED", backgroundColor: "white" }}>
        <Typography component="h2" sx={{ fontWeight: 700, p: fr.spacing("4v"), borderBottom: "1px solid #E0E5ED" }}>
          Rechercher un établissement
        </Typography>
        <Box sx={{ mt: fr.spacing("4v"), px: fr.spacing("4v") }}>
          <Formik initialValues={{ keyword: "" }} validationSchema={toFormikValidationSchema(ZSearchForm)} onSubmit={search}>
            {(formik) => (
              <Form ref={formRef} onSubmit={createSubmitWithFocusOnError(formRef, formik)} noValidate>
                <Box sx={{ mb: fr.spacing("4v") }}>
                  <CustomDSFRInput
                    label="Identification de l'établissement (obligatoire)"
                    hintText="SIRET formateur (14 chiffres, sans espace), UAI (7 chiffres et 1 lettre, par exemple 0751234A), clé ministère éducatif ou identifiant RCO de la formation"
                    required={true}
                    name="keyword"
                    nativeInputProps={{
                      type: "text",
                      required: true,
                    }}
                  />
                </Box>
                <Button type="submit" disabled={loading} style={{ marginBottom: "10px" }}>
                  Rechercher
                </Button>
              </Form>
            )}
          </Formik>
        </Box>
      </Box>
    </>
  )
}
