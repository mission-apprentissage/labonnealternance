import { Button, Flex, Spinner, Text } from "@chakra-ui/react"
import React from "react"

import { amongst } from "../../../utils/arrayutils"

const CandidatureLbaSubmit = (props) => {
  const sendingState = props.sendingState
  const kind = props?.item?.ideaType || ""

  switch (sendingState) {
    case "not_sent": {
      return (
        
          {amongst(kind, ["lbb", "lba"]) ? <Button data-trackingid="postuler-entreprise-algo" aria-label="Envoyer la candidature spontanée" variant="blackButton" type="submit" data-testid="candidature-not-sent">J'envoie ma candidature spontanée</Button> : <Button data-trackingid="postuler-offre-lba" aria-label="Envoyer la candidature" variant="blackButton" type="submit" data-testid="candidature-not-sent">J'envoie ma candidature</Button>}
        
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

export default CandidatureLbaSubmit
