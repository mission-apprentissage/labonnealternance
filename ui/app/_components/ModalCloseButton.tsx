import { Box, Text } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"

import { Close } from "@/theme/components/icons"

export default function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <Box display={"flex"} alignSelf={"flex-end"}>
      <Button type="button" priority="tertiary no outline" onClick={onClose}>
        fermer
        <Text as={"span"} ml={2}>
          <Close boxSize={4} />
        </Text>
      </Button>
    </Box>
  )
}
