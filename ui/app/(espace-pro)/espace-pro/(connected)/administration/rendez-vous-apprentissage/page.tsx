"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { Form, Formik } from "formik"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { IFormationCatalogueJson } from "shared"

import { AdminLayout } from "@/app/(espace-pro)/espace-pro/(connected)/_components/AdminLayout"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import CustomDSFRInput from "@/app/_components/CustomDSFRInput"
import { useToast } from "@/app/hooks/useToast"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

export default function RendezVousApprentissage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  /**
   * @description Returns search results.
   * @param {Object} values
   * @param {String} values.keyword
   * @returns {Promise<void>}
   */
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
    <AdminLayout currentAdminPage="RECHERCHE_RENDEZ_VOUS">
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.rendezVousApprentissageRecherche]} />
      <Box sx={{ border: "1px solid #E0E5ED", backgroundColor: "white" }}>
        <Typography component="h2" sx={{ fontWeight: 700, p: fr.spacing("2w"), borderBottom: "1px solid #E0E5ED" }}>
          Rechercher un établissement
        </Typography>
        <Box sx={{ mt: fr.spacing("2w"), px: fr.spacing("2w") }}>
          <Formik initialValues={{ keyword: "" }} onSubmit={search}>
            <Form>
              <Box sx={{ mb: fr.spacing("2w") }}>
                <CustomDSFRInput
                  label="Identification de l'établissement *"
                  required={true}
                  name="keyword"
                  nativeInputProps={{
                    type: "text",
                    placeholder: "Siret formateur / Cle ministère educatif / UAI / Identifiant RCO formation",
                  }}
                />
              </Box>
              <Button type="submit" disabled={loading} style={{ marginBottom: "10px" }}>
                Rechercher
              </Button>
            </Form>
          </Formik>
        </Box>
      </Box>
    </AdminLayout>
  )
}
