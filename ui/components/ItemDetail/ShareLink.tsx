import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { SyntheticEvent, useEffect, useState } from "react"
import { ILbaItemFormationJson, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

const ShareLink = ({ item }: { item: ILbaItemFormationJson | ILbaItemFtJobJson | ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemPartnerJobJson }) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [item.id])

  const copyLink = (e: SyntheticEvent) => {
    e.preventDefault()

    const link = window.location.toString()
    navigator.clipboard.writeText(link).then(function () {
      setCopied(true)
    })
  }

  return (
    <Button priority="tertiary no outline" onClick={copyLink} data-tracking-id={`partager-${item.ideaType}`}>
      {copied ? (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Image src="/images/icons/share_copied_icon.svg" width={16} height={16} aria-hidden={true} alt="" />
          <Typography color="#18753C">Lien copié !</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Image src="/images/icons/share_icon.svg" width={16} height={16} aria-hidden={true} alt="" />
          <Typography color="bluefrance.500">Partager</Typography>
        </Box>
      )}
    </Button>
  )
}

export default ShareLink
