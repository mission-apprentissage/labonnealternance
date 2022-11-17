import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Container, useToast } from "@chakra-ui/react"
import { useQuery, useQueryClient } from "react-query"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { getOffre, postOffre, putOffre } from "../../api"
import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { AjouterVoeux } from "../../components"
import { ArrowDropRightLine } from "../../theme/components/icons"

export default () => {
  const params = useParams()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const client = useQueryClient()
  const [auth] = useAuth()

  const { data, isLoading } = useQuery("offre", () => getOffre(params.id_offre), {
    enabled: params.id_offre !== "creation" ? true : false,
    cacheTime: 0,
  })

  const handleSave = (values) => {
    // Updates an offer
    if (params.id_offre !== "creation") {
      putOffre(params.id_offre, values)
        .then(() => {
          toast({
            title: "Offre mise à jour avec succès.",
            position: "top-right",
            status: "success",
            duration: 2000,
            isClosable: true,
          })
        })
        .finally(() => navigate(-1))
    } else {
      if (auth.type === AUTHTYPE.ENTREPRISE) {
        // Create the offer and return the form with the related offer created
        return postOffre(params.id_form, values).then(({ data }) => ({
          form: data,
          offre: data.offres.slice(-1).shift(),
        }))
      }

      postOffre(params.id_form, values)
        .then(() => {
          toast({
            title: "Offre enregistrée avec succès.",
            position: "top-right",
            status: "success",
            duration: 2000,
            isClosable: true,
          })
        })
        .then(() => client.invalidateQueries("offre-liste"))
        .finally(() => navigate(-1))
    }
  }

  if (isLoading) return "Chargement en cours..."

  return (
    <Container maxW="container.xl" mt={5}>
      <Box mb={5}>
        <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
          {auth.sub !== "anonymous" && auth.type !== AUTHTYPE.ENTREPRISE && (
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              <BreadcrumbItem>
                <BreadcrumbLink textDecoration="underline" onClick={() => navigate(-1)} textStyle="xs">
                  Administration des offres
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink textStyle="xs">{location.state.raison_sociale}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          )}
        </Breadcrumb>
      </Box>
      <AjouterVoeux fromDashboard handleSave={handleSave} {...data?.data[0]} />
    </Container>
  )
}
