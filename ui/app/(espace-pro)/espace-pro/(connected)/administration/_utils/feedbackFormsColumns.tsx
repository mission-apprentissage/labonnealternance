import { fr } from "@codegouvfr/react-dsfr"
import Badge from "@codegouvfr/react-dsfr/Badge"
import { Box, Typography } from "@mui/material"
import dayjs from "dayjs"
import type { IFeedbackFormForAdminJSON, IFeedbackFormStatus } from "shared/models/feedback-form.model"

import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import type { ColumnDef } from "@/app/(espace-pro)/_components/VirtualTable"

import type { IFeedbackFormActionItem } from "../formulaires-feedback/_utils/feedbackFormActions"
import { getFeedbackFormActions } from "../formulaires-feedback/_utils/feedbackFormActions"

const STATUS_BADGE: Record<IFeedbackFormStatus, { label: string; severity: "success" | "info" | "warning" | "new" }> = {
  draft: { label: "Brouillon", severity: "new" },
  active: { label: "Actif", severity: "success" },
  inactive: { label: "Inactif", severity: "warning" },
  archived: { label: "Archivé", severity: "info" },
}

export function FeedbackFormStatusBadge({ status }: { status: IFeedbackFormStatus }) {
  const { label, severity } = STATUS_BADGE[status]
  return (
    <Badge small noIcon severity={severity}>
      {label}
    </Badge>
  )
}

export function getFeedbackFormsColumns({
  onAction,
}: {
  onAction: (form: IFeedbackFormForAdminJSON, action: IFeedbackFormActionItem) => void
}): ColumnDef<IFeedbackFormForAdminJSON>[] {
  return [
    {
      id: "title",
      header: "Titre",
      accessorKey: "title",
      size: 280,
      cell: (info) => {
        const form = info.row.original
        const questionCount = form.questions.length
        const details = [form.trigger.scope.join(", "), `${questionCount} question${questionCount > 1 ? "s" : ""}`].filter(Boolean).join(" · ")
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <Typography sx={{ fontSize: ".875rem", fontWeight: 700 }}>{form.title}</Typography>
            <Typography sx={{ fontSize: ".75rem", color: fr.colors.decisions.text.mention.grey.default }}>{details}</Typography>
          </Box>
        )
      },
    },
    {
      id: "slug",
      header: "Slug",
      accessorKey: "slug",
      size: 180,
      cell: (info) => (
        <Typography component="code" sx={{ fontFamily: "monospace", fontSize: ".8125rem" }}>
          {info.getValue<string>()}
        </Typography>
      ),
    },
    {
      id: "status",
      header: "Statut",
      accessorKey: "status",
      size: 110,
      cell: (info) => <FeedbackFormStatusBadge status={info.getValue<IFeedbackFormStatus>()} />,
    },
    {
      id: "version",
      header: "Version",
      accessorKey: "version",
      size: 80,
      cell: (info) => `v${info.getValue<number>()}`,
    },
    {
      id: "responses_count",
      header: "Réponses",
      accessorKey: "responses_count",
      size: 100,
      cell: (info) => {
        const count = info.getValue<number>()
        return count === 0 ? (
          <Typography sx={{ fontSize: ".875rem", color: fr.colors.decisions.text.mention.grey.default }}>—</Typography>
        ) : (
          <Typography sx={{ fontSize: ".875rem", fontWeight: 700 }}>{count.toLocaleString("fr-FR")}</Typography>
        )
      },
    },
    {
      id: "updated_at",
      header: "Modifié le",
      accessorKey: "updated_at",
      size: 120,
      cell: (info) => dayjs(info.getValue<string>()).format("DD/MM/YYYY"),
    },
    {
      id: "actions",
      header: "",
      meta: { srOnly: "Actions sur le formulaire" },
      size: 80,
      enableSorting: false,
      cell: (info) => {
        const form = info.row.original
        const actions: PopoverMenuAction[] = getFeedbackFormActions(form).map((action) =>
          action.kind === "link"
            ? { label: action.label, type: "link", hint: form.title, link: action.href }
            : { label: action.label, type: "button", hint: form.title, onClick: () => onAction(form, action) }
        )
        return <PopoverMenu title={`Actions sur le formulaire ${form.title}`} actions={actions} />
      },
    },
  ]
}
