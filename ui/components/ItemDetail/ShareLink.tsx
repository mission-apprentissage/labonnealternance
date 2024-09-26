import { Button, Image, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { ILbaItemFormation, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "shared"
import { oldItemTypeToNewItemType } from "shared/constants/lbaitem"

const ShareLink = ({ item }: { item: ILbaItemFormation | ILbaItemFtJob | ILbaItemLbaCompany | ILbaItemLbaJob }) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [item.id])

  const copyLink = (e) => {
    e.preventDefault()
    navigator.clipboard.writeText(window.location.href).then(function () {
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
          <Text fontSize={14} color="bluefrance.500">
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
