import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Link as ChakraLink,
  Container,
  Flex,
  Heading,
  Icon,
  Image,
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
import { useRouter } from "next/router"
import { memo, useEffect, useState } from "react"
import { useQuery } from "react-query"

import { RECRUITER_STATUS } from "../../../common/contants"
import useAuth from "../../../common/hooks/useAuth"
import { sortReactTableDate, sortReactTableString } from "../../../common/utils/dateUtils"
import BreadcrumbLink from "../../../components/BreadcrumbLink"
import { AnimationContainer, ConfirmationSuppressionEntreprise, Layout, LoadingEmptySpace, TableNew } from "../../../components/espace_pro"
import addOfferImage from "../../../components/espace_pro/assets/images/add-offer.svg"
import withAuth from "../../../components/espace_pro/withAuth"
import Link from "../../../components/Link"
import { Parametre } from "../../../theme/components/icons"
import { getFormulaires } from "../../../utils/api"

const EmptySpace = () => (
  <Stack direction={["column", "column", "column", "row"]} mt={12} pt={12} py={8} border="1px solid" borderColor="grey.400" spacing="32px">
    <Flex justify={["center", "center", "center", "flex-end"]} align={["center", "center", "center", "flex-start"]} w={["100%", "100%", "100%", "350px"]} h="150px">
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
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

function ListeEntreprise() {
  const [currentEntreprise, setCurrentEntreprise] = useState()
  const confirmationSuppression = useDisclosure()
  const router = useRouter()
  const [auth] = useAuth()
  const toast = useToast()

  useEffect(() => {
    if (router.query.newUser) {
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

  const { data, isLoading } = useQuery("listeEntreprise", () =>
    getFormulaires({ status: { $in: [RECRUITER_STATUS.ACTIF, RECRUITER_STATUS.EN_ATTENTE_VALIDATION] }, cfa_delegated_siret: auth.cfa_delegated_siret })
  )

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  const columns = [
    {
      Header: "Entreprise",
      id: "establishment_raison_sociale",
      width: "500",
      maxWidth: "500",
      sortType: (a, b) => sortReactTableString(a.original.establishment_raison_sociale, b.original.establishment_raison_sociale),
      accessor: ({ establishment_id, establishment_raison_sociale, establishment_siret }) => (
        <Link href={`/espace-pro/administration/entreprise/${establishment_id}`}>{establishment_raison_sociale ?? establishment_siret}</Link>
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
      accessor: ({ jobs }) => jobs.length,
    },
    {
      Header: "Dernière offre créée le",
      id: "date_creation_offre",
      disableSortBy: true,
      width: "225",
      accessor: ({ jobs }) => {
        if (jobs.length > 0) {
          const last = jobs.pop()
          return dayjs(last.job_creation_date).format("DD/MM/YYYY")
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
                      <Link href={`/espace-pro/administration/entreprise/${row.establishment_id}`}>Voir les offres</Link>
                    </MenuItem>
                    <MenuItem>
                      <ChakraLink
                        onClick={() => {
                          confirmationSuppression.onOpen()
                          setCurrentEntreprise(row)
                        }}
                      >
                        Supprimer l'entreprise
                      </ChakraLink>
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
  // @ts-expect-error: TODO
  if (data?.data.length === 0) {
    return (
      <AnimationContainer>
        {/* @ts-expect-error: TODO */}
        <ConfirmationSuppressionEntreprise {...confirmationSuppression} {...currentEntreprise} />
        <Container maxW="container.xl" mt={5}>
          <Box mb={5}>
            <Breadcrumb spacing="4px" textStyle="xs">
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink href="/espace-pro/administration" textStyle="xs">
                  Administration des offres
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          </Box>
          <Flex justify="space-between" mb={12}>
            <Text fontSize="2rem" fontWeight={700}>
              Mes entreprises
            </Text>
            <Button variant="primary" size="sm" mr={3} onClick={() => router.push(`/espace-pro/administration/entreprise`)}>
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
      {/* @ts-expect-error: TODO */}
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
          <Button variant="primary" size="sm" mr={3} onClick={() => router.push(`/espace-pro/administration/entreprise`)}>
            Nouvelle entreprise
          </Button>
        </Flex>
        {/* @ts-expect-error: TODO */}
        <TableNew columns={columns} data={data?.data} exportable={false} />
      </Container>
    </AnimationContainer>
  )
}

function ListeEntreprisePage() {
  return (
    <Layout footer={false}>
      <ListeEntreprise />
    </Layout>
  )
}
export default withAuth(memo(ListeEntreprisePage))
