import { Flex, Image, Spacer } from "@chakra-ui/react"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

export const IntensionFormNavigation = () => {
  return (
    <Flex width="80%" maxWidth="800px" margin="auto" pt={12}>
      <DsfrLink style={{ backgroundImage: "none" }} href="/">
        <Image src="/images/logo_LBA.svg" alt="" minWidth="160px" width="160px" />
      </DsfrLink>
      <Spacer minWidth={8} />
      <DsfrLink style={{ backgroundImage: "none" }} href="/">
        Page d&apos;accueil La bonne alternance
      </DsfrLink>
    </Flex>
  )
}
