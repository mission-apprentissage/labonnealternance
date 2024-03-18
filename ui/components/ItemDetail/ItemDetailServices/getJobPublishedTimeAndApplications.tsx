import { Flex, Image, Text } from "@chakra-ui/react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { getDaysSinceDate } from "../../../utils/dateUtils"

export default function getJobPublishedTimeAndApplications({ item }) {
  const res = (
    <Flex textAlign="center">
      {item?.job?.creationDate && (
        <Text color="grey.600" fontSize="12px" mr={4}>
          Publiée depuis {getDaysSinceDate(item.job.creationDate)} jour(s)
        </Text>
      )}
      {[LBA_ITEM_TYPE_OLD.MATCHA, LBA_ITEM_TYPE_OLD.LBA].includes(item?.ideaType) && (
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
