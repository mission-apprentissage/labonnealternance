import { Box, Button, Heading, Input, Text, useToast } from "@chakra-ui/react"
import { Field, Form, Formik } from "formik"
import Head from "next/head"
import { useRouter } from "next/router"
import React, { useState } from "react"
import { IFormationCatalogue } from "shared"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { Layout } from "@/components/espace_pro"
import { apiGet } from "@/utils/api.utils"

import { OldBreadcrumb } from "../../../../components/espace_pro/common/components/Breadcrumb"
import { authProvider, withAuth } from "../../../../components/espace_pro/withAuth"

function SearchPage() {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const title = "Rechercher"

  /**
   * @description Returns search results.
   * @param {Object} values
   * @param {String} values.keyword
   * @returns {Promise<void>}
   */
  const search = async (values) => {
    const { keyword } = values

    setSearchKeyword(keyword)

    try {
      const keywordEncoded = encodeURIComponent(keyword)
      const formations = (await apiGet("/admin/formations", { querystring: { search_item: keywordEncoded } })) as IFormationCatalogue[]

      if (!formations.length) {
        toast({
          title: "Aucun établissement trouvé dans le catalogue.",
          status: "info",
          isClosable: true,
          position: "bottom-right",
        })
      } else {
        await router.push(`/espace-pro/admin/eligible-trainings-for-appointment/edit/${formations[0].etablissement_formateur_siret}`)
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
    <Layout footer={false} rdva>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon/favicon.ico" />
      </Head>
      <OldBreadcrumb pages={[{ title: "Administration", to: "/espace-pro/administration/users" }, { title }]} />
      <Heading textStyle="h2" mt={5}>
        {title}
      </Heading>
      <Box border="1px solid #E0E5ED" bg="white" mx={40} mt={20}>
        {loading && <Button isLoading={loading} color="secondary" />}
        <Text fontWeight="500" textStyle="h6" p={4} px={6} borderBottom="1px solid #E0E5ED">
          Rechercher un établissement
        </Text>
        <Box mt={5} px={6}>
          <Formik initialValues={{ keyword: searchKeyword }} onSubmit={search}>
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
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(SearchPage, "admin"))
