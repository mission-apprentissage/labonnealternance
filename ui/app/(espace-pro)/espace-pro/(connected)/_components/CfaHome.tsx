"use client"

import { Box, Button as ChakraButton, Container, Flex, Heading, Icon, Image, Menu, MenuButton, MenuItem, MenuList, Stack, Text, useDisclosure, useToast } from "@chakra-ui/react"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Link } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { IRecruiter, IRecruiterJson } from "shared"

import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { sortReactTableDate, sortReactTableString } from "@/common/utils/dateUtils"
import { AnimationContainer, LoadingEmptySpace, TableNew } from "@/components/espace_pro"
import { ConfirmationSuppressionEntreprise } from "@/components/espace_pro/ConfirmationSuppressionEntreprise"
import { Parametre } from "@/theme/components/icons"
import { getEntreprisesManagedByCfa } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

const EmptySpace = () => (
  <Stack direction={["column", "column", "column", "row"]} mt={12} pt={12} py={8} border="1px solid" borderColor="grey.400" spacing="32px">
    <Flex justify={["center", "center", "center", "flex-end"]} align={["center", "center", "center", "flex-start"]} w={["100%", "100%", "100%", "350px"]} h="150px">
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src="/images/espace_pro/images/add-offer.svg" />
    </Flex>

    <Box w={["100%", "100%", "100%", "600px"]}>
      <Heading fontSize="2rem" pb={7} datatest-id="header-ajouter-entreprise">
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
  const [currentEntreprise, setCurrentEntreprise] = useState<IRecruiterJson | null>(null)
  const confirmationSuppression = useDisclosure()
  const router = useRouter()
  const { access } = useConnectedSessionClient()

  const toast = useToast()
  const { newUser: isNewUser } = useSearchParamsRecord()

  useEffect(() => {
    if (isNewUser) {
      toast({
        title: "Vérification réussie",
        description: "Votre adresse mail a été validée avec succès.",
        position: "top-right",
        status: "success",
        duration: 7000,
        isClosable: true,
      })
    }
  }, [isNewUser, toast])

  const cfaId = access?.cfas.at(0)

  const { data, isLoading } = useQuery({
    queryKey: ["listeEntreprise"],
    queryFn: () => getEntreprisesManagedByCfa(cfaId),
    enabled: Boolean(cfaId),
  })

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  const columns = [
    {
      Header: "",
      id: "action",
      maxWidth: "40",
      disableSortBy: true,
      accessor: (row: IRecruiterJson) => {
        return (
          <Box>
            <Menu>
              {({ isOpen }) => (
                <>
                  <MenuButton isActive={isOpen} as={ChakraButton} variant="navdot">
                    <Icon as={Parametre} color="bluefrance.500" />
                  </MenuButton>
                  <MenuList>
                    <MenuItem>
                      <Link underline="hover" href={PAGES.dynamic.backCfaPageEntreprise(row.establishment_id).getPath()}>
                        Voir les offres
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        underline="hover"
                        component="button"
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
    {
      Header: "Entreprise",
      id: "establishment_raison_sociale",
      width: "500",
      maxWidth: "500",
      sortType: (a, b) => sortReactTableString(a.original.establishment_raison_sociale, b.original.establishment_raison_sociale),
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { establishment_raison_sociale, establishment_siret, establishment_id, opco } = data[id]
        const siretText = (
          <Text color="#666666" fontSize="14px">
            SIRET {establishment_siret}
          </Text>
        )
        return (
          <Flex direction="column">
            <Link underline="hover" fontWeight="700" href={PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath()} aria-label="voir les informations">
              {establishment_raison_sociale}
            </Link>
            {establishment_raison_sociale ? (
              siretText
            ) : (
              <Link underline="hover" fontWeight="700" href={PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath()} aria-label="voir les informations">
                {siretText}
              </Link>
            )}
            <Text color="redmarianne" fontSize="14px">
              {opco}
            </Text>
          </Flex>
        )
      },
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
      accessor: ({ jobs }: IRecruiterJson) => jobs.length,
    },
    {
      Header: "Dernière offre créée le",
      id: "date_creation_offre",
      disableSortBy: true,
      width: "225",
      accessor: ({ jobs }: IRecruiter /* should be IRecruiterJson but jobs is not typed properly */) => {
        if (jobs.length > 0) {
          const last = jobs.pop()
          return dayjs(last.job_creation_date).format("DD/MM/YYYY")
        } else {
          return ""
        }
      },
    },
  ]
  return (
    <AnimationContainer>
      {currentEntreprise && (
        <ConfirmationSuppressionEntreprise
          establishment_id={currentEntreprise.establishment_id}
          onClose={confirmationSuppression.onClose}
          isOpen={confirmationSuppression.isOpen}
          establishment_raison_sociale={currentEntreprise.establishment_raison_sociale}
        />
      )}
      <Container maxW="container.xl" mt={5}>
        <Breadcrumb pages={[PAGES.static.backCfaHome]} />
        <Flex justify="space-between" mb={12}>
          <Text fontSize="2rem" fontWeight={700}>
            Mes entreprises
          </Text>
          <Box mr={3}>
            <Button size="small" onClick={() => router.push(PAGES.static.backCfaCreationEntreprise.getPath())}>
              Nouvelle entreprise
            </Button>
          </Box>
        </Flex>
        {data?.length ? <TableNew columns={columns} data={data} exportable={false} /> : <EmptySpace />}
      </Container>
    </AnimationContainer>
  )
}

export default ListeEntreprise
