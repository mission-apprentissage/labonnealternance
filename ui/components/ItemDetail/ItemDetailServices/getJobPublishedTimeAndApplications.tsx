import { Box } from "@mui/material"
import Image from "next/image"
import type { ILbaItemJobsGlobal, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

import { getDaysSinceDate } from "@/utils/dateUtils"

const hasJob = (item: ILbaItemJobsGlobal): item is ILbaItemLbaJobJson | ILbaItemPartnerJobJson => "job" in item
const hasSmartApply = (item: ILbaItemJobsGlobal): boolean => !!item.contact?.hasEmail || !!item.contact?.url || !!item.contact?.phone

export default function getJobPublishedTimeAndApplications({ item }: { item: ILbaItemJobsGlobal }) {
  return (
    <Box sx={{ display: "flex", textAlign: "center" }}>
      {hasJob(item) && item.job.creationDate && <Box sx={{ color: "grey.600", fontSize: "12px", mr: 4 }}>Publiée depuis {getDaysSinceDate(item.job.creationDate)} jour(s)</Box>}
      {hasSmartApply(item) && item.applicationCount != null && (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Image width={16} height={17} src="/images/eclair.svg" alt="" />
          <Box sx={{ color: "#0063CB", fontSize: "12px", whiteSpace: "nowrap", ml: 1, textTransform: "uppercase", fontWeight: "bold" }}>{item.applicationCount} candidature(s)</Box>
        </Box>
      )}
    </Box>
  )
}
