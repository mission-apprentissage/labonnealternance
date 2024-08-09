import { ILbaItemFormation, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "@/../shared"
import { LBA_ITEM_TYPE_OLD } from "@/../shared/constants/lbaitem"
import { Text } from "@chakra-ui/react"

const getAPostuleMessage = (type, applicationDate, mt) => {
  const date = new Date(parseInt(applicationDate, 10)).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Text as="span" mt={mt} px={2} py={1} backgroundColor="#FEF7DA">
      {type === LBA_ITEM_TYPE_OLD.FORMATION
        ? `
        👍 Super, vous avez déjà pris contact le ${date}.`
        : `🤞 Bravo, vous avez déjà postulé le ${date}.`}
    </Text>
  )
}

export default function ItemDetailApplicationsStatus({ item, mt }: { item: ILbaItemFormation | ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemFtJob; mt: number }) {
  const key = `candidaturespontanee-${item.ideaType}-${item.id}`
  const ls = window.localStorage.getItem(key)

  return ls !== null ? getAPostuleMessage(item.ideaType, ls, mt) : <></>
}
