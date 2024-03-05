import { Flex, Image, Text } from "@chakra-ui/react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaiten"

import { getDaysSinceDate } from "../../../utils/dateUtils"

export default function getJobPublishedTimeAndApplications({ item }) {
  const res = (
    <Flex textAlign="center">
      {item?.job?.creationDate && (
        <Text color="grey.600" fontSize="12px" mr={4}>
          Publiée depuis {getDaysSinceDate(item.job.creationDate)} jour(s)
        </Text>
      )}
      {[LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.RECRUTEURS_LBA].includes(item?.ideaType) && (
        <Flex alignItems="center">
          <Image mr={1} src="/images/eclair.svg" alt="" />
          <Text color="#0063CB" display="flex" fontSize="12px" whiteSpace="nowrap" mr={2}>
            {item.applicationCount} candidature(s)
          </Text>
        </Flex>
      )}
    </Flex>
  )

  return res
}
