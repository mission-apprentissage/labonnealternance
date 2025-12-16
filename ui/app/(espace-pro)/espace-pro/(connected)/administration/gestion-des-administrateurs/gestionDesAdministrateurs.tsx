"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"

import { AdminUserForm } from "./_components/AdminUserForm"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import TableWithPagination from "@/app/(espace-pro)/_components/TableWithPagination"
import { AdminLayout } from "@/app/(espace-pro)/espace-pro/(connected)/_components/AdminLayout"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { sortReactTableString } from "@/common/utils/dateUtils"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { ArrowRightLine } from "@/theme/components/icons"
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
    <AdminLayout currentAdminPage="GESTION_ADMINISTRATEURS">
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminGestionDesAdministrateurs]} />
      <ModalReadOnly isOpen={newUser.isOpen} onClose={newUser.onClose} size="md">
        <Box sx={{ pb: fr.spacing("2w"), px: fr.spacing("2w") }}>
          <Typography className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("1w") }} component="h2">
            Ajouter un nouvel utilisateur
          </Typography>

          <AdminUserForm
            onCreate={async () => {
              newUser.onClose()
              await refetchUsers()
            }}
          />
        </Box>
      </ModalReadOnly>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={newUser.onOpen}>Créer un utilisateur</Button>
      </Box>

      <TableWithPagination
        data={users || []}
        columns={[
          {
            Header: "Actions",
            id: "action",
            maxWidth: "80",
            disableSortBy: true,
            accessor: (row) => {
              return (
                <Button priority="tertiary no outline" onClick={() => router.push(PAGES.dynamic.backEditAdministrator({ userId: row._id }).getPath())}>
                  <ArrowRightLine sx={{ mr: fr.spacing("1w"), width: 16, height: 16 }} />
                </Button>
              )
            },
          },
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
            accessor: ({ last_action_date }) => {
              return dayjs(last_action_date).format("DD/MM/YYYY")
            },
          },
        ]}
        searchPlaceholder="Rechercher par email"
        exportable={null}
        description={null}
        defaultSortBy={[{ id: "createdAt", desc: true }]}
      />
    </AdminLayout>
  )
}
