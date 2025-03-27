import { Image, Text } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { useEffect, useState } from "react"
import { ILbaItemFormationJson, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

const ShareLink = ({ item }: { item: ILbaItemFormationJson | ILbaItemFtJobJson | ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemPartnerJobJson }) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [item.id])

  const copyLink = (e) => {
    e.preventDefault()

    const link = window.location.toString()
    navigator.clipboard.writeText(link).then(function () {
      setCopied(true)
    })
  }

  return (
    <Button priority="tertiary no outline" onClick={copyLink} data-tracking-id={`partager-${item.ideaType}`}>
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
