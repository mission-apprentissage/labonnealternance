import Badge from "@codegouvfr/react-dsfr/Badge"
import { Typography } from "@mui/material"
import type { INewsletterJSON } from "shared/models/newsletter.model"

import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import type { ColumnDef } from "@/app/(espace-pro)/_components/VirtualTable"
import { formatNewsletterDate } from "@/utils/newsletter.utils"

export function getNewslettersColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (newsletter: INewsletterJSON) => void
  onDelete: (newsletter: INewsletterJSON) => void
}): ColumnDef<INewsletterJSON>[] {
  return [
    {
      id: "edition_date",
      header: "Date de l'édition",
      accessorKey: "edition_date",
      size: 140,
      cell: (info) => formatNewsletterDate(info.getValue<string>()),
    },
    {
      id: "title",
      header: "Titre",
      accessorKey: "title",
      size: 320,
      cell: (info) => <Typography sx={{ fontSize: ".875rem", fontWeight: 700 }}>{info.getValue<string>()}</Typography>,
    },
    {
      id: "linkedin_url",
      header: "Lien LinkedIn",
      accessorKey: "linkedin_url",
      size: 280,
      enableSorting: false,
      cell: (info) => (
        <Typography component="span" sx={{ fontSize: ".8125rem", wordBreak: "break-all" }}>
          {info.getValue<string>()}
        </Typography>
      ),
    },
    {
      id: "is_visible",
      header: "Affichage",
      accessorKey: "is_visible",
      size: 110,
      cell: (info) =>
        info.getValue<boolean>() ? (
          <Badge small noIcon severity="success">
            Affichée
          </Badge>
        ) : (
          <Badge small noIcon>
            Masquée
          </Badge>
        ),
    },
    {
      id: "actions",
      header: "",
      meta: { srOnly: "Actions sur l'infolettre" },
      size: 80,
      enableSorting: false,
      cell: (info) => {
        const newsletter = info.row.original
        const actions: PopoverMenuAction[] = [
          { label: "Voir sur LinkedIn", type: "externalLink", hint: newsletter.title, link: newsletter.linkedin_url },
          { label: "Modifier", type: "button", hint: newsletter.title, onClick: () => onEdit(newsletter) },
          { label: "Supprimer", type: "button", hint: newsletter.title, onClick: () => onDelete(newsletter) },
        ]
        return <PopoverMenu title={`Actions sur l'infolettre ${newsletter.title}`} actions={actions} />
      },
    },
  ]
}
