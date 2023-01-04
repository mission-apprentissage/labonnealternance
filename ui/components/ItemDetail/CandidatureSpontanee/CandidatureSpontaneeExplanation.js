import React from "react"

import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Link } from "@chakra-ui/react"
import { AddIcon, ExternalLinkIcon, MinusIcon } from "@chakra-ui/icons"

const CandidatureSpontaneeExplanation = (props) => {
  // Collapse Open state
  const [isOpen, setIsOpen] = React.useState(false)

  const getTitle = () => {
    let res = ""
    if (props.about == "what") {
      res = "Qu'est ce qu'une candidature spontanée ?"
    } else if (props.about == "how") {
      res = "Comment se préparer pour une candidature spontanée ? "
    }
    return res
  }

  const getText = () => {
    let res = ""
    if (props.about == "what") {
      res = (
        <Box pl="12px" mt={4}>
          L&apos;entreprise n&apos;a pas déposé d&apos;offre d&apos;emploi, vous pouvez tout de même lui envoyer votre CV pour lui indiquer que vous seriez très intéressé⸱e pour
          intégrer son équipe dans le cadre de votre apprentissage.
        </Box>
      )
    } else if (props.about == "how") {
      res = (
        <>
          <Box pl="12px" mt={4}>
            Adaptez votre lettre de motivation à l&apos;entreprise aux informations recueillies : Activité, actualités et valeurs
            <br />
            <br />
            Mettez en valeur vos qualités en lien avec le métier recherché et indiquez pourquoi vous souhaitez réaliser votre alternance dans cette entreprise en particulier.
            <br />
            <br />
            Besoin d&apos;aide pour concevoir votre CV ? Il existe plusieurs outils gratuits :
            <Box mt={3}>
              &bull;
              <Link href="https://cv.clicnjob.fr/" ml={3} isExternal variant="basicUnderlined">
                https://cv.clicnjob.fr/ <ExternalLinkIcon ml="2px" mb="3px" />
              </Link>
            </Box>
            <Box mt={2}>
              &bull;
              <Link href="https://cvdesignr.com/fr" ml={3} isExternal variant="basicUnderlined">
                https://cvdesignr.com/fr <ExternalLinkIcon ml="2px" mb="3px" />
              </Link>
            </Box>
            <Box mt={2}>
              &bull;
              <Link href="https://www.canva.com/fr_fr/creer/cv/" ml={3} isExternal variant="basicUnderlined">
                https://www.canva.com/fr_fr/creer/cv/ <ExternalLinkIcon ml="2px" mb="3px" />
              </Link>
            </Box>
          </Box>
        </>
      )
    }
    return res
  }

  return (
    <Accordion allowToggle>
      <AccordionItem>
        {({ isExpanded }) => (
          <>
            <AccordionButton fontSize="1rem" fontWeight={700} color="#161616">
              <Box as="span" flex="1" textAlign="left">
                {getTitle()}
              </Box>
              {isExpanded ? <MinusIcon fontSize="10px" /> : <AddIcon fontSize="10px" />}
            </AccordionButton>

            <AccordionPanel pb={4}>{getText()}</AccordionPanel>
          </>
        )}
      </AccordionItem>
    </Accordion>
  )
}

export default CandidatureSpontaneeExplanation
