import { Box } from "@mui/material"
import Image from "next/image"
import type { ILbaItemJobsGlobal, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { getDaysSinceDate } from "@/utils/dateUtils"

export default function getJobPublishedTimeAndApplications({ item }: { item: ILbaItemJobsGlobal }) {
  const hasJob = (item: ILbaItemJobsGlobal): item is ILbaItemLbaJobJson | ILbaItemPartnerJobJson => {
    return "job" in item
  }
  const res = (
    <Box sx={{ display: "flex", textAlign: "center" }}>
      {hasJob(item) && item.job.creationDate && <Box sx={{ color: "grey.600", fontSize: "12px", mr: 4 }}>Publiée depuis {getDaysSinceDate(item.job.creationDate)} jour(s)</Box>}
      {(item.ideaType === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA || item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA) && (
        <Box sx={{ display: "flex", textAlign: "center" }}>
          <Image width={16} height={17} src="/images/eclair.svg" alt="" />
          <Box sx={{ color: "#0063CB", fontSize: "12px", whiteSpace: "nowrap", ml: 1 }}>{item.applicationCount} candidature(s)</Box>
        </Box>
      )}
    </Box>
  )

  return res
}
