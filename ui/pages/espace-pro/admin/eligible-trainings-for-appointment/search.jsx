import { Box, Button, Heading, Input, Text, useToast } from "@chakra-ui/react"
import { Field, Form, Formik } from "formik"
import Head from "next/head"
import { useRouter } from "next/router"
import React, { useState } from "react"

import { _get } from "../../../../common/httpClient"
import { Breadcrumb } from "../../../../components/espace_pro/common/components/Breadcrumb"

export default function SearchPage() {
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
      const formations = await _get(
        `admin/formations?query={ "$or": [ { "etablissement_formateur_siret": "${keywordEncoded}" }, { "etablissement_formateur_uai": "${keywordEncoded}"}, { "id_rco_formation": "${keywordEncoded}"}, {"cle_ministere_educatif": "${keywordEncoded}"} ] }`
      )

      if (!formations.length) {
        toast({
          title: "Aucun établissement trouvé dans le catalogue.",
          status: "info",
          isClosable: true,
          position: "bottom-right",
        })
      } else {
        router.push(`/espace-pro/admin/eligible-trainings-for-appointment/edit/${formations[0].etablissement_formateur_siret}`)
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
    <Box w="100%" pt={[4, 8]} px={[1, 1, 12, 24]} pb={40}>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon/favicon.ico" />
      </Head>
      <Breadcrumb pages={[{ title: "Administration", to: "/admin" }, { title }]} />
      <Heading textStyle="h2" mt={5}>
        {title}
      </Heading>
      <Box border="1px solid #E0E5ED" bg="white" mx={40} mt={20}>
        {loading && <Button isLoading={loading} color="secondary" block />}
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
    </Box>
  )
}

// TODO_AB add HOC restriction page PRIVATE ROUTE redirect to admin/login
