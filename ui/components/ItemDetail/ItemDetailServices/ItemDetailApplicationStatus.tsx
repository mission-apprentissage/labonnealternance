import { ILbaItemFormation, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "@/../shared"
import { LBA_ITEM_TYPE_OLD } from "@/../shared/constants/lbaitem"
import { Box, Text } from "@chakra-ui/react"

const getAPostuleMessage = (type, applicationDate, mb, mt) => {
  const date = new Date(parseInt(applicationDate, 10)).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Box mb={mb} mt={mt}>
      <Text color="grey.600" fontSize="12px" fontStyle="italic" as="span" px={2} py={1} backgroundColor="#FEF7DA">
        {type === LBA_ITEM_TYPE_OLD.FORMATION
          ? `
        👍 Super, vous avez déjà pris contact le ${date}.`
          : `🤞 Bravo, vous avez déjà postulé le ${date}.`}
      </Text>
    </Box>
  )
}

export default function ItemDetailApplicationsStatus({ item, mb, mt }: { item: ILbaItemFormation | ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemFtJob; mb: number; mt: number }) {
  const key = `candidaturespontanee-${item.ideaType}-${item.id}`
  const ls = window.localStorage.getItem(key)

  return ls !== null ? getAPostuleMessage(item.ideaType, ls, mb, mt) : <></>
}
