import React from "react"

import linkedIn from "../../public/images/icons/linkedin.svg"
import ExternalLink from "../externalLink"
import { Box, Text } from "@chakra-ui/react"

const FollowLinkedIn = () => {
  return (
    <Box as="section" className="c-follow-linkedin c-homecomponent__blue p-3 mb-5 d-flex">
      <Box ml={3}>
        <Text as="p">
          <strong>
            La mission interministérielle pour l’apprentissage et les trajectoires professionnelles construit des services numériques qui facilitent les entrées en apprentissage.
          </strong>
        </Text>
        <Text fontWeight={700} color="#000091" fontSize={32} pt={2}>
          Rendez-vous sur LinkedIn pour suivre nos actualités
        </Text>
      </Box>
      <Box display="flex" alignItems="center" justifyContent="center">
        <ExternalLink
          className="c-follow-linkedin-button px-3 py-2 mx-3 d-flex"
          url="https://www.linkedin.com/company/mission-apprentissage"
          aria-label="Accès à la page Linkedin de la mission interministérielle pour l’apprentissage et les trajectoires professionnelles"
          title="Voir notre page &nbsp;"
          withPic={<img src={linkedIn} alt="Lien" />}
        />
      </Box>
    </Box>
  )
}

export default FollowLinkedIn
