import { Box } from "@mui/material"
import Image from "next/image"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { getDaysSinceDate } from "../../../utils/dateUtils"

export default function getJobPublishedTimeAndApplications({ item }) {
  const res = (
    <Box sx={{ display: "flex", textAlign: "center" }}>
      {item?.job?.creationDate && <Box sx={{ color: "grey.600", fontSize: "12px", mr: 4 }}>Publiée depuis {getDaysSinceDate(item.job.creationDate)} jour(s)</Box>}
      {[LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.RECRUTEURS_LBA].includes(item?.ideaType) && (
        <Box sx={{ display: "flex", textAlign: "center" }}>
          <Image width={16} height={17} src="/images/eclair.svg" alt="" />
          <Box sx={{ color: "#0063CB", fontSize: "12px", whiteSpace: "nowrap", ml: 1 }}>{item.applicationCount} candidature(s)</Box>
        </Box>
      )}
    </Box>
  )

  return res
}
