import { Flex, Image, Text } from "@chakra-ui/react"
import React from "react"
import { getDaysSinceDate } from "../../../utils/dateUtils"
import eclair from "../../../public/images/eclair.svg"

export default function getJobPublishedTimeAndApplications({ item }) {
  let res = (
    <Flex textAlign="center">
      {item?.job?.creationDate && (
        <Text color="grey.600" fontSize="12px" mr={4}>
          Publiée depuis {getDaysSinceDate(item.job.creationDate)} jour(s)
        </Text>
      )}
      {["matcha", "lba"].includes(item?.ideaType) && (
        <Flex alignItems="center">
          <Image mr={1} src={eclair} alt="" />
          <Text color="#0063CB" display="flex" fontSize="12px" whiteSpace="nowrap" mr={2}>
            {item.applicationCount} candidature(s)
          </Text>
        </Flex>
      )}
    </Flex>
  )

  return res
}
