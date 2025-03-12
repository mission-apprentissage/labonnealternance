import { ILbaItemFormation2, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "@/../shared"
import { Text } from "@chakra-ui/react"
import { useContext } from "react"

import { DisplayContext } from "@/context/DisplayContextProvider"

export default function ItemDistanceToCenter({ item }: { item: ILbaItemFormation2 | ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemFtJob }) {
  const { formValues } = useContext(DisplayContext)

  return formValues?.location?.value && (item?.place?.distance ?? -1) >= 0 ? (
    <Text as="span" color="grey.425" whiteSpace="nowrap" fontSize={14}>
      {item?.place?.distance} km(s) du lieu de recherche
    </Text>
  ) : null
}
