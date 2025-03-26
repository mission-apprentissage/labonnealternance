"use client"

import { Box, Flex, Modal, ModalContent, ModalHeader, ModalOverlay, useDisclosure } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { AdminLayout } from "@/app/(espace-pro)/espace-pro/(connected)/_components/AdminLayout"
import { AdminUserForm } from "@/app/(espace-pro)/espace-pro/(connected)/administration/gestion-des-administrateurs/_components/AdminUserForm"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import ModalCloseButton from "@/app/_components/ModalCloseButton"
import { sortReactTableString } from "@/common/utils/dateUtils"
import { TableNew } from "@/components/espace_pro"
import { EAdminPages } from "@/components/espace_pro/Layout/NavigationAdmin"
import { ArrowRightLine2 } from "@/theme/components/icons"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

export default function GestionDesAdministrateurs() {
  const newUser = useDisclosure()
  const router = useRouter()
  const {
    data: users,
    isLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["adminusers"],

    queryFn: async () => {
      const users = await apiGet("/admin/users", {})
      return users.users
    },
  })

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  return (
    <AdminLayout currentAdminPage={EAdminPages.GESTION_ADMINISTRATEURS}>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminGestionDesAdministrateurs]} />
      <Modal isOpen={newUser.isOpen} onClose={newUser.onClose} size="4xl">
        <ModalOverlay />
        <ModalContent borderRadius="0" p={10}>
          <ModalHeader paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
            <Box as="span" verticalAlign="middle">
              Ajouter un nouvel utilisateur
            </Box>
          </ModalHeader>
          <ModalCloseButton onClose={newUser.onClose} />
          <AdminUserForm
            onCreate={async () => {
              newUser.onClose()
              await refetchUsers()
            }}
          />
        </ModalContent>
      </Modal>

      <Flex justifyContent="flex-end">
        <Button onClick={newUser.onOpen}>Créer un utilisateur</Button>
      </Flex>

      <TableNew
        data={users || []}
        columns={[
          {
            Header: "Email",
            id: "email",
            width: "300",
            accessor: "email",
            sortType: (a, b) => sortReactTableString(a.original.email, b.original.email),
            Cell: ({ value }) => value,
            filter: "fuzzyText",
          },
          {
            Header: "Type",
            id: "type",
            accessor: ({ type }) => type,
          },
          {
            Header: "Actif",
            id: "last_connection",
            accessor: ({ last_action_date: date }) => {
              return date ? dayjs(date).format("DD/MM/YYYY") : "Jamais"
            },
          },
          {
            Header: "Actions",
            id: "action",
            maxWidth: "80",
            disableSortBy: true,
            accessor: (row) => {
              return (
                <Button priority="tertiary no outline" onClick={() => router.push(PAGES.dynamic.backEditAdministrator({ userId: row._id }).getPath())}>
                  <ArrowRightLine2 w="1w" />
                </Button>
              )
            },
          },
        ]}
        searchPlaceholder="Rechercher par email"
        exportable={null}
        description={null}
      />
    </AdminLayout>
  )
}
