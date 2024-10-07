import { Button, Image, Text } from "@chakra-ui/react"
import { useContext, useEffect, useState } from "react"
import { ILbaItemFormation, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "shared"
import { LBA_ITEM_TYPE_OLD, oldItemTypeToNewItemType } from "shared/constants/lbaitem"

import { DisplayContext } from "@/context/DisplayContextProvider"

const ShareLink = ({ item }: { item: ILbaItemFormation | ILbaItemFtJob | ILbaItemLbaCompany | ILbaItemLbaJob }) => {
  const [copied, setCopied] = useState(false)

  const { formValues } = useContext(DisplayContext)

  useEffect(() => {
    setCopied(false)
  }, [item.id])

  const copyLink = (e) => {
    e.preventDefault()

    const link =
      item.ideaType === LBA_ITEM_TYPE_OLD.LBA && !formValues?.location?.value
        ? `${window.location.origin}${window.location.pathname}?display=list&page=fiche&type=lba&itemId=${item.id}`
        : window.location.href
    navigator.clipboard.writeText(link).then(function () {
      setCopied(true)
    })
  }

  return (
    <Button
      sx={copied ? {} : { borderBottom: "1px solid #000091" }}
      mx={2}
      mb={4}
      px={0}
      pb={0}
      height={7}
      borderRadius={0}
      _hover={{ bg: "none" }}
      _focus={{ bg: "none" }}
      background="none"
      border="none"
      display="flex"
      alignItems="center"
      fontWeight={400}
      onClick={copyLink}
      data-tracking-id={`partager-${oldItemTypeToNewItemType(item.ideaType)}`}
    >
      {copied ? (
        <>
          <Image mr={2} src="/images/icons/share_copied_icon.svg" aria-hidden={true} alt="" />
          <Text fontSize={14} color="#18753C">
            Lien copié !
          </Text>
        </>
      ) : (
        <>
          <Image mr={2} src="/images/icons/share_icon.svg" aria-hidden={true} alt="" />
          <Text fontSize={14} color="bluefrance.500">
            Partager
          </Text>
        </>
      )}
    </Button>
  )
}

export default ShareLink
