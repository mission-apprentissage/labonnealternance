import { Box, Button, Flex, Modal, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, useDisclosure } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"

import { sortReactTableString } from "@/common/utils/dateUtils"
import Link from "@/components/Link"
import { ArrowRightLine2 } from "@/theme/components/icons"

import { apiGet } from "../../../../utils/api.utils"
import LoadingEmptySpace from "../../LoadingEmptySpace"
import TableNew from "../../TableNew"

import { AdminUserForm } from "./AdminUserForm"

const AdminUserList = () => {
  const newUser = useDisclosure()

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
    <>
      <Modal isOpen={newUser.isOpen} onClose={newUser.onClose} size="4xl">
        <ModalOverlay />
        <ModalContent borderRadius="0" p={10}>
          <ModalHeader paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
            <Box as="span" verticalAlign="middle">
              Ajouter un nouvel utilisateur
            </Box>
          </ModalHeader>
          <ModalCloseButton width="80px">
            fermer
            <Box paddingLeft="1w" as="i" className="ri-close-line" />
          </ModalCloseButton>
          <AdminUserForm
            onCreate={async () => {
              newUser.onClose()
              await refetchUsers()
            }}
          />
        </ModalContent>
      </Modal>

      <Flex justifyContent="flex-end">
        <Button variant="primary" onClick={newUser.onOpen}>
          Créer un utilisateur
        </Button>
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
                <Link href={`/espace-pro/admin/utilisateurs/${row._id}`}>
                  <ArrowRightLine2 w="1w" />
                </Link>
              )
            },
          },
        ]}
        searchPlaceholder="Rechercher par email"
        exportable={null}
        description={null}
      />
    </>
  )
}

export default AdminUserList
