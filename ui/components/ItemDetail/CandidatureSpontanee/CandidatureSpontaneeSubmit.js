import { Button, Flex, Spinner, Text } from "@chakra-ui/react"
import React from "react"
import { amongst } from "../../../utils/arrayutils"

const CandidatureSpontaneeSubmit = (props) => {
  const sendingState = props.sendingState
  const kind = props?.item?.ideaType || ""

  switch (sendingState) {
    case "not_sent": {
      return (
        <Button aria-label="je-postule" variant="blackButton" type="submit" data-testid="candidature-not-sent">
          {amongst(kind, ["lbb", "lba"]) ? "J'envoie ma candidature spontanée" : "J'envoie ma candidature"}
        </Button>
      )
    }
    case "currently_sending": {
      return (
        <Flex alignItems="center" direction="row" data-testid="candidature-currently-sending">
          <Spinner mr={4} />
          <Text>Veuillez patienter</Text>
        </Flex>
      )
    }
    default:
      return ""
  }
}

export default CandidatureSpontaneeSubmit
