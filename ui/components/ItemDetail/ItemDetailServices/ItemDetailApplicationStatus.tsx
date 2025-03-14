"use client"
import { Box, Text } from "@chakra-ui/react"
import { ILbaItemFormation, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { localStorageGet } from "@/utils/localStorage"

const getAPostuleMessage = (type: LBA_ITEM_TYPE | LBA_ITEM_TYPE_OLD, applicationDate: string, mb = 0, mt = 0) => {
  const date = new Date(parseInt(applicationDate, 10)).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Box mb={mb} mt={mt}>
      <Text color="grey.600" fontSize="12px" as="span" px={2} py={1} backgroundColor="#FEF7DA">
        {type === LBA_ITEM_TYPE.FORMATION ? (
          <>
            <Text as="span">👍 </Text>
            <Text as="span" fontStyle="italic">
              Super, vous avez déjà pris contact le {date}.
            </Text>
          </>
        ) : (
          <>
            <Text as="span">🤞 </Text>
            <Text as="span" fontStyle="italic">
              Bravo, vous avez déjà postulé le {date}.
            </Text>
          </>
        )}
      </Text>
    </Box>
  )
}

export const hasApplied = (item: ILbaItemFormation | ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemFtJob | ILbaItemPartnerJob) => {
  return localStorage.getItem(`application-${item.ideaType}-${item.id}`) !== null
}

export default function ItemDetailApplicationsStatus({
  item,
  mb = 0,
  mt = 0,
}: {
  item: ILbaItemFormation | ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemFtJob | ILbaItemPartnerJob
  mb?: number
  mt?: number
}) {
  const key = `application-${item.ideaType}-${item.id}`
  const ls = localStorageGet(key)

  return ls !== null ? getAPostuleMessage(item.ideaType, ls, mb, mt) : <></>
}
