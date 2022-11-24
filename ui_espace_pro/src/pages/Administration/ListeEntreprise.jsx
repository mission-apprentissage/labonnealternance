import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Image,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import dayjs from "dayjs"
import { memo, useEffect, useState } from "react"
import { useQuery } from "react-query"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { getFormulaires } from "../../api"
import addOfferImage from "../../assets/images/add-offer.svg"
import useAuth from "../../common/hooks/useAuth"
import { sortReactTableDate, sortReactTableString } from "../../common/utils/dateUtils"
import { AnimationContainer, ConfirmationSuppressionEntreprise, LoadingEmptySpace, TableNew } from "../../components"
import { Parametre } from "../../theme/components/icons"

const EmptySpace = () => (
  <Stack direction={["column", "column", "column", "row"]} mt={12} pt={12} py={8} border="1px solid" borderColor="grey.400" spacing="32px">
    <Flex justify={["center", "center", "center", "flex-end"]} align={["center", "center", "center", "flex-start"]} w={["100%", "100%", "100%", "350px"]} h="150px">
      <Image src={addOfferImage} />
    </Flex>

    <Box w={["100%", "100%", "100%", "600px"]}>
      <Heading fontSize="2rem" pb={7}>
        Ajoutez votre première entreprise partenaire
      </Heading>
      <Text fontSize="1.375rem">Une entreprise partenaire vous fait confiance pour gérer ses offres d’emploi ?</Text>
      <Text fontSize="1.375rem">
        Décrivez les besoins de recrutement de cette entreprise pour les afficher sur le site <span style={{ fontWeight: "700" }}>La bonne alternance</span> dès aujourd’hui.
      </Text>
    </Box>
  </Stack>
)

export default memo(() => {
  const [currentEntreprise, setCurrentEntreprise] = useState()
  const confirmationSuppression = useDisclosure()
  const location = useLocation()
  const navigate = useNavigate()
  const [auth] = useAuth()
  const toast = useToast()

  useEffect(() => {
    if (location.state?.newUser) {
      toast({
        title: "Vérification réussie",
        description: "Votre adresse mail a été validée avec succès.",
        position: "top-right",
        status: "success",
        duration: 7000,
        isClosable: true,
      })
    }
  }, [])

  const { data, isLoading } = useQuery("listeEntreprise", () => getFormulaires({ statut: "Actif", gestionnaire: auth.gestionnaire }))

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  const columns = [
    {
      Header: "Entreprise",
      id: "raison_sociale",
      width: "500",
      maxWidth: "500",
      sortType: (a, b) => sortReactTableString(a.original.raison_sociale, b.original.raison_sociale),
      accessor: ({ id_form, raison_sociale }) => (
        <Link as={NavLink} to={`/administration/entreprise/${id_form}`}>
          {raison_sociale}
        </Link>
      ),
    },
    {
      Header: "Ajoutée le",
      accessor: ({ createdAt }) => dayjs(createdAt).format("DD/MM/YYYY"),
      id: "createdAt",
      sortType: (a, b) => sortReactTableDate(a.original.createdAt, b.original.createdAt),
    },
    {
      Header: "Offres",
      id: "nombre_offres",
      sortType: "basic",
      accessor: ({ offres }) => offres.length,
    },
    {
      Header: "Dernière offre créée le",
      id: "date_creation_offre",
      disableSortBy: true,
      width: "225",
      accessor: ({ offres }) => {
        if (offres.length > 0) {
          let last = offres.pop()
          return dayjs(last.date_creation).format("DD/MM/YYYY")
        } else {
          return ""
        }
      },
    },
    {
      Header: "",
      id: "action",
      maxWidth: "50",
      disableSortBy: true,
      accessor: (row) => {
        return (
          <Box display={["none", "block"]}>
            <Menu>
              {({ isOpen }) => (
                <>
                  <MenuButton isActive={isOpen} as={Button} variant="navdot" _hover={{ backgroundColor: "none" }}>
                    <Icon as={Parametre} color="bluefrance.500" />
                  </MenuButton>
                  <MenuList>
                    <MenuItem>
                      <Link as={NavLink} to={`/administration/entreprise/${row.id_form}`}>
                        Voir les offres
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        onClick={() => {
                          confirmationSuppression.onOpen()
                          setCurrentEntreprise(row)
                        }}
                      >
                        Supprimer l'entreprise
                      </Link>
                    </MenuItem>
                  </MenuList>
                </>
              )}
            </Menu>
          </Box>
        )
      },
    },
  ]

  if (data?.data.length === 0) {
    return (
      <AnimationContainer>
        <ConfirmationSuppressionEntreprise {...confirmationSuppression} {...currentEntreprise} />
        <Container maxW="container.xl" mt={5}>
          <Box mb={5}>
            <Breadcrumb spacing="4px" textStyle="xs">
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink href="#" textStyle="xs">
                  Administration des offres
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          </Box>
          <Flex justify="space-between" mb={12}>
            <Text fontSize="2rem" fontWeight={700}>
              Mes entreprises
            </Text>
            <Button variant="primary" size="sm" mr={3} onClick={() => navigate(`/administration/entreprise`)}>
              Nouvelle entreprise
            </Button>
          </Flex>
          <EmptySpace />
        </Container>
      </AnimationContainer>
    )
  }

  return (
    <AnimationContainer>
      <ConfirmationSuppressionEntreprise {...confirmationSuppression} {...currentEntreprise} />
      <Container maxW="container.xl" mt={5}>
        <Box mb={5}>
          <Breadcrumb spacing="4px" textStyle="xs">
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink href="#" textStyle="xs">
                Administration des offres
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Box>
        <Flex justify="space-between" mb={12}>
          <Text fontSize="2rem" fontWeight={700}>
            Mes entreprises
          </Text>
          <Button variant="primary" size="sm" mr={3} onClick={() => navigate(`/administration/entreprise`)}>
            Nouvelle entreprise
          </Button>
        </Flex>
        <TableNew columns={columns} data={data?.data} exportable={false} />
      </Container>
    </AnimationContainer>
  )
})
