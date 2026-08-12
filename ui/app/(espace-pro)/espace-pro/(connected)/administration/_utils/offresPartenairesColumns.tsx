import { Box, Stack, Typography } from "@mui/material"
import type { ColumnDef } from "@tanstack/react-table"
import dayjs from "dayjs"
import { JOB_STATUS_ENGLISH, traductionJobStatus } from "shared/models/job.model"
import type { IJobsPartnersOfferForAdminJSON } from "shared/models/jobs-partners.model"

import type { useDisclosure } from "@/app/hooks/use-disclosure"
import { CustomTag, type CustomTagColor } from "@/components/SearchForTrainingsAndJobs/components/CustomTag"
import { sortReactTableDate } from "@/utils/date-utils"
import { OffresPartenairesMenu } from "../offres-partenaires/OffresPartenairesMenu"

type DisclosureReturn = ReturnType<typeof useDisclosure>

const statusTagColor: Record<JOB_STATUS_ENGLISH, CustomTagColor> = {
  [JOB_STATUS_ENGLISH.ACTIVE]: "green",
  [JOB_STATUS_ENGLISH.POURVUE]: "darkBlue",
  [JOB_STATUS_ENGLISH.ANNULEE]: "red",
  [JOB_STATUS_ENGLISH.EN_ATTENTE]: "yellow",
}

export function getOffresPartenairesColumns({
  setCurrentOffer,
  confirmationDesactivationOffre,
  confirmationClassificationOffre,
}: {
  setCurrentOffer: (o: IJobsPartnersOfferForAdminJSON | null) => void
  confirmationDesactivationOffre: DisclosureReturn
  confirmationClassificationOffre: DisclosureReturn
}): ColumnDef<IJobsPartnersOfferForAdminJSON>[] {
  return [
    {
      id: "action",
      header: "",
      meta: { srOnly: "Actions sur l'offre" },
      size: 50,
      enableSorting: false,
      cell: (info) => (
        <OffresPartenairesMenu
          row={info.row.original}
          setCurrentOffer={setCurrentOffer}
          confirmationDesactivationOffre={confirmationDesactivationOffre}
          confirmationClassificationOffre={confirmationClassificationOffre}
        />
      ),
    },
    {
      id: "partner_label",
      header: "Partenaire",
      accessorKey: "partner_label",
      size: 160,
      enableSorting: false,
      cell: (info) => <Typography sx={{ fontSize: ".75rem", fontWeight: 700 }}>{info.getValue<string>()}</Typography>,
    },
    {
      id: "offer_title",
      header: "Offre",
      size: 305,
      enableSorting: false,
      cell: (info) => {
        const { offer_title, partner_job_id } = info.row.original
        return (
          <Stack spacing={0.5}>
            <Typography sx={{ fontSize: ".75rem", fontWeight: 700 }}>{offer_title}</Typography>
            <Typography sx={{ color: "#666666", fontSize: ".75rem" }}>Id partenaire : {partner_job_id}</Typography>
          </Stack>
        )
      },
    },
    {
      id: "workplace",
      header: "Entreprise",
      size: 260,
      enableSorting: false,
      cell: (info) => {
        const { workplace_legal_name, workplace_name, workplace_siret, is_delegated, cfa_legal_name } = info.row.original
        return (
          <Stack spacing={0.5}>
            <Typography sx={{ fontSize: ".75rem", fontWeight: 700 }}>{workplace_legal_name || workplace_name || "—"}</Typography>
            <Typography sx={{ color: "#666666", fontSize: ".75rem" }}>SIRET {workplace_siret || "—"}</Typography>
            {is_delegated && (
              <Box>
                <CustomTag color="yellow">Délégué à {cfa_legal_name || "un CFA"}</CustomTag>
              </Box>
            )}
          </Stack>
        )
      },
    },
    {
      id: "offer_status",
      header: "Statut",
      size: 120,
      accessorKey: "offer_status",
      enableSorting: false,
      cell: (info) => {
        const status = info.getValue<JOB_STATUS_ENGLISH>()
        return <CustomTag color={statusTagColor[status]}>{traductionJobStatus(status)}</CustomTag>
      },
    },
    {
      id: "classification",
      header: "Classification",
      size: 180,
      enableSorting: false,
      cell: (info) => {
        const classification = info.row.original.classification
        if (!classification) return <CustomTag color="darkBlue">Non classé</CustomTag>
        const { model, human_verification } = classification
        if (human_verification === "unpublish") return <CustomTag color="red">CFA signalé</CustomTag>
        if (human_verification === "publish") return <CustomTag color="green">Publiable</CustomTag>
        if (model === "unpublish") return <CustomTag color="yellow">Suggéré CFA (ML)</CustomTag>
        if (model === "publish") return <CustomTag color="yellow">Suggéré publiable (ML)</CustomTag>
        return <CustomTag color="darkBlue">Non classé</CustomTag>
      },
    },
    {
      id: "offer_creation",
      header: "Créée le",
      accessorKey: "offer_creation",
      size: 110,
      sortingFn: (a, b) => sortReactTableDate(a.original.offer_creation, b.original.offer_creation),
      cell: (info) => {
        const value = info.getValue<string | null>()
        return <Typography sx={{ color: "#666666", fontSize: ".75rem" }}>{value ? dayjs(value).format("DD/MM/YYYY") : "—"}</Typography>
      },
    },
  ]
}
