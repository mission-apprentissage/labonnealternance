"use client"
import { Box, Button, Heading, Input, Text, useToast } from "@chakra-ui/react"
import { Field, Form, Formik } from "formik"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { IFormationCatalogue } from "shared"

import { AdminLayout } from "@/app/(espace-pro)/espace-pro/(connected)/_components/AdminLayout"
import { EAdminPages } from "@/components/espace_pro/Layout/NavigationAdmin"
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
      const formations: IFormationCatalogue[] = await apiGet("/admin/formations", { querystring: { search_item: keywordEncoded } })

      if (!formations.length) {
        toast({
          title: "Aucun établissement trouvé dans le catalogue.",
          status: "info",
          isClosable: true,
          position: "bottom-right",
        })
      } else {
        router.push(PAGES.dynamic.rendezVousApprentissageDetail({ siret: formations[0].etablissement_formateur_siret }).getPath())
      }
    } catch (e) {
      toast({
        title: "Une erreur est survenue pendant la recherche.",
        status: "error",
        isClosable: true,
        position: "bottom-right",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout currentAdminPage={EAdminPages.RECHERCHE_RENDEZ_VOUS}>
      <Heading textStyle="h2" mt={5}>
        Rechercher
      </Heading>
      <Box border="1px solid #E0E5ED" bg="white" mx={40} mt={20}>
        {loading && <Button isLoading={loading} color="secondary" />}
        <Text fontWeight="500" textStyle="h6" p={4} px={6} borderBottom="1px solid #E0E5ED">
          Rechercher un établissement
        </Text>
        <Box mt={5} px={6}>
          <Formik initialValues={{ keyword: "" }} onSubmit={search}>
            <Form>
              <Box>
                <Field name="keyword">
                  {({ field }) => {
                    return <Input placeholder="Siret formateur / Cle ministère educatif / UAI / Identifiant RCO formation" {...field} />
                  }}
                </Field>
              </Box>
              <Button variant="primary" mt={3} mb={5} type={"submit"} isLoading={loading}>
                Rechercher
              </Button>
            </Form>
          </Formik>
        </Box>
      </Box>
    </AdminLayout>
  )
}
