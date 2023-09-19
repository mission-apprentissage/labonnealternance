import { Box, Button, Heading, Input, Text, useToast } from "@chakra-ui/react"
import { Field, Form, Formik } from "formik"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Breadcrumb } from "../../../../common/components/Breadcrumb"
import { setTitle } from "../../../../common/utils/pageUtils"
import { _get } from "../../../../common/httpClient"

const SearchPage = () => {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const title = "Rechercher"
  setTitle(title)

  /**
   * @description Returns search results.
   * @param {Object} values
   * @param {Object} options
   * @param {Boolean} options.disableLoading - Disable setLoading
   * @param {String} values.keyword
   * @returns {Promise<void>}
   */
  const search = async (values, options = { disableLoading: false }) => {
    const { keyword } = values

    setSearchKeyword(keyword)

    try {
      const keywordEncoded = encodeURIComponent(keyword)
      const formations = await _get(
        `/api/admin/formations?query={ "$or": [ { "etablissement_formateur_siret": "${keywordEncoded}" }, { "etablissement_formateur_uai": "${keywordEncoded}"}, { "id_rco_formation": "${keywordEncoded}"}, {"cle_ministere_educatif": "${keywordEncoded}"} ] }`
      )

      if (!formations.length) {
        toast({
          title: "Aucun établissement trouvé dans le catalogue.",
          status: "info",
          isClosable: true,
          position: "bottom-right",
        })
      } else {
        navigate(`/admin/eligible-tranings-for-appointment/edit/${formations[0].etablissement_formateur_siret}`)
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
      <Breadcrumb pages={[{ title: "Administration", to: "/admin" }, { title }]} />
      <Heading textStyle="h2" mt={5}>
        {title}
      </Heading>
      <Box border="1px solid #E0E5ED" bg="white" mx={40} mt={20}>
        {loading && <Button loading color="secondary" block />}
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
              <Button variant="primary" mt={3} mb={5} type={"submit"} loading={loading}>
                Rechercher
              </Button>
            </Form>
          </Formik>
        </Box>
      </Box>
    </Box>
  )
}

export default SearchPage
