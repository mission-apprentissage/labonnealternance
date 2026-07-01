import { Box, Link, Stack, Typography } from "@mui/material"
import type { ColumnDef } from "@tanstack/react-table"
import type { ILbaCompanyForAdminSearchJSON } from "shared/routes/updateLbaCompany.routes"

import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import { sortReactTableString } from "@/common/utils/dateUtils"

export function getLbaCompaniesColumns({ onSelect }: { onSelect: (siret: string) => void }): ColumnDef<ILbaCompanyForAdminSearchJSON>[] {
  return [
    {
      id: "action",
      header: "",
      meta: { srOnly: "Actions sur la société" },
      size: 50,
      enableSorting: false,
      cell: (info) => {
        const { siret, raison_sociale } = info.row.original
        return (
          // stopPropagation : évite que l'ouverture du menu déclenche aussi le onRowClick de la ligne
          <Box onClick={(e) => e.stopPropagation()}>
            <PopoverMenu
              title={`Actions sur la société ${raison_sociale ?? siret}`}
              actions={[
                {
                  label: "Éditer les coordonnées",
                  ariaLabel: `Éditer les coordonnées de la société ${raison_sociale ?? siret}`,
                  type: "button",
                  onClick: () => onSelect(siret),
                },
              ]}
            />
          </Box>
        )
      },
    },
    {
      id: "raison_sociale",
      header: "Etablissement",
      accessorKey: "raison_sociale",
      size: 310,
      sortingFn: (a, b) => sortReactTableString(a.original.raison_sociale ?? "", b.original.raison_sociale ?? ""),
      cell: (info) => {
        const { raison_sociale, enseigne, siret, opco } = info.row.original
        return (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Link component="button" fontWeight="700" onClick={() => onSelect(siret)} sx={{ textAlign: "left" }} aria-label="éditer les coordonnées de la société">
              {raison_sociale || enseigne || siret}
            </Link>
            <Typography sx={{ color: "#666666", fontSize: ".75rem" }}>SIRET {siret}</Typography>
            {opco && (
              <Typography sx={{ color: "#666666", maxWidth: "100%", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden", fontSize: ".75rem" }}>
                Opco : {opco}
              </Typography>
            )}
          </Box>
        )
      },
    },
    {
      id: "contact",
      header: "Contact",
      size: 310,
      enableSorting: false,
      accessorFn: (row) => `${row.email ?? ""} ${row.phone ?? ""}`,
      cell: (info) => {
        const { email, phone } = info.row.original
        return (
          <Stack spacing={0.5}>
            <Typography sx={{ color: "#666666", fontSize: ".75rem", whiteSpace: "normal", wordBreak: "break-all" }}>{email || "—"}</Typography>
            <Typography sx={{ color: "#666666", fontSize: ".75rem", whiteSpace: "normal", wordBreak: "break-all" }}>{phone || "—"}</Typography>
          </Stack>
        )
      },
    },
  ]
}
