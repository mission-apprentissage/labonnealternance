import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Link, ListItem, Text, UnorderedList } from "@chakra-ui/react"

const ConseilsEtAstuces = () => {
  return (
    <Accordion defaultIndex={[0]} allowMultiple>
      <AccordionItem borderTop="1px solid" borderTopColor="#DDD">
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            Pour définir votre projet
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          <Box>
            <UnorderedList>
              <ListItem mb={4}>
                <Text as="span" fontWeight={700}>
                  Vous ne savez pas vers quel métier vous orienter ?
                </Text>{" "}
                Faites le point avec Diagoriente, un service qui vous accompagne dans la construction de votre orientation professionnelle.{" "}
                <Link href="https://diagoriente.beta.gouv.fr/" aria-label="Accéder au site de Diagoriente" isExternal variant="basicUnderlinedBlue">
                  C'est parti ! <ExternalLinkIcon mb="3px" ml="2px" />
                </Link>{" "}
              </ListItem>
              <ListItem mb={4}>
                <Text as="span" fontWeight={700}>
                  L’alternance augmente d'environ 10% vos chances de trouver un emploi en sortie de formation
                </Text>
                , par rapport à une formation scolaire. Et ce, car l'alternance vous permet d'acquérir une première expérience professionnelle. En contrepartie, c’est un mode de
                formation exigeant qui implique un rythme de travail professionnel, avec des congés limités et non plus de vacances scolaires.
              </ListItem>
              <ListItem>
                <Text as="span" fontWeight={700}>
                  Des doutes sur votre orientation ?
                </Text>{" "}
                Pensez à la Prépa-apprentissage : un dispositif qui vous permet de découvrir un ou plusieurs métiers !{" "}
                <Link
                  href="https://travail-emploi.gouv.fr/le-ministere-en-action/pic/prepa-apprentissage-pic"
                  aria-label="Accéder au site de présentation de la prépa apprentissage"
                  isExternal
                  variant="basicUnderlinedBlue"
                >
                  En savoir plus <ExternalLinkIcon mb="3px" ml="2px" />
                </Link>
              </ListItem>
            </UnorderedList>
          </Box>
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem borderTop="1px solid" borderTopColor="#DDD">
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            Pour vous faire accompagner par des conseillers
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          <Box>
            <UnorderedList>
              <ListItem mb={4}>
                <Text as="span" fontWeight={700}>
                  Contactez la Mission locale de votre secteur.
                </Text>{" "}
                Des conseillers vous aideront dans vos recherches d'entreprise. Trouver ma mission locale
              </ListItem>
              <ListItem mb={4}>
                <Text as="span" fontWeight={700}>
                  L'ANAF (Association Nationale des Apprentis de France)
                </Text>{" "}
                peut vous aider à tout moment de votre parcours et pour toute question que vous vous posez ! En savoir plus{" "}
              </ListItem>
              <ListItem mb={4}>
                <Text as="span" fontWeight={700}>
                  Un mentor (ancien alternant ou adulte actif inséré dans la vie professionnelle)
                </Text>{" "}
                peut vous épauler tout au long de votre parcours et suivant vos besoins ! En savoir plus
              </ListItem>
              <ListItem mb={4}>Profitez d'un accompagnement proche de chez vous pour votre parcours et vos démarches avec 1 jeune 1 solution</ListItem>
            </UnorderedList>
          </Box>
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem borderTop="1px solid" borderTopColor="#DDD">
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            À propos des formations en alternance
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          <Box>
            <UnorderedList>
              <ListItem mb={4}>
                <Text as="span" fontWeight={700}>
                  La plupart des organismes de formations font des journées portes ouvertes :
                </Text>{" "}
                vous y trouverez l'occasion d'échanger avec des alternants !
              </ListItem>
              <ListItem mb={4}>
                {" "}
                Combien de personnes ont trouvé un emploi dans les 6 mois après avoir obtenu le diplôme que vous souhaitez préparer ? La réponse ici ! En savoir plus
              </ListItem>
              <ListItem mb={4}>
                {" "}
                Certains établissements de formation obtiennent des labels d'excellence, c'est par exemple le cas des CMQ (Campus des Métiers et Qualifications d'excellence). En
                savoir plus
              </ListItem>
            </UnorderedList>
          </Box>
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem borderTop="1px solid" borderTopColor="#DDD">
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            Pour trouver un employeur
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          <Box>
            <UnorderedList>
              <ListItem mb={4}>
                Tout au long de l'année, il existe des salons de recrutement (physiques ou virtuels) spécialisés pour l'alternance : renseignez-vous ! Voir les salons l’Étudiant
                Voir les salons Studyrama
              </ListItem>
              <ListItem mb={4}>
                {" "}
                France Travail recense de nombreux évènements (conférences, salons, job dating, conférences en ligne…) pour vous aider dans vos recherches de contrat. En savoir
                plus
              </ListItem>
              <ListItem mb={4}>Le secteur public (mairies, ministères, départements, régions, ...) recrute aussi des alternants, pensez-y ! En savoir plus</ListItem>
              <ListItem mb={4}>
                {" "}
                Plus d’un employeur sur deux recrute sans déposer d'offre d'emploi : optimisez vos chances en adressant aussi des candidatures spontanées !
              </ListItem>
            </UnorderedList>
          </Box>
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem borderTop="1px solid" borderTopColor="#DDD">
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            Pour préparer vos candidatures
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          <Box>
            <UnorderedList>
              <ListItem mb={4}>
                {" "}
                Besoin d'aide pour construire un CV à partir de vos expériences ? Inscrivez-vous gratuitement sur Diagoriente et laissez-vous guider dans la construction d'un CV
                pertinent, mettant en lumière vos compétences. En savoir plus
              </ListItem>
              <ListItem mb={4}> Besoin d'aide pour concevoir un beau CV ? Vous pouvez le faire gratuitement sur CVdesignr. En savoir plus</ListItem>
              <ListItem mb={4}>
                {" "}
                Motivation, Dynamisme et Présentation soignée : 3 qualités recherchées par les employeurs de jeunes candidats. Mettez-les en avant dans votre candidature !
              </ListItem>
              <ListItem mb={4}>
                {" "}
                Les recruteurs font attention à de petits détails ! Professionnalisez vos candidatures en utilisant une adresse email adaptée aux contacts professionnels (par
                exemple : nom.prenom@email.fr et en personnalisant votre messagerie vocale sur votre téléphone (par exemple : “Bonjour, vous êtes bien sur la messagerie vocale de
                [prénom+nom]. Je ne suis pas disponible pour le moment, laissez-moi un message et je vous rappellerai dès que possible. Merci !”)
              </ListItem>
              <ListItem mb={4}>
                Les employeurs qui embauchent des alternants reçoivent des aides, jusqu’à 6000€ selon le dernier décret : c'est un bon argument pour convaincre une entreprise qui
                ne connaît pas l'alternance de vous embaucher !
              </ListItem>
            </UnorderedList>
          </Box>
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem borderTop="1px solid" borderTopColor="#DDD">
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            À propos de votre rémunération
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          <Box>
            <UnorderedList>
              <ListItem mb={4}>
                Se former en alternance ne vous coûte rien ! En plus de percevoir une rémunération, votre employeur prend en charge le financement de votre formation.
              </ListItem>
              <ListItem mb={4}> Quel sera votre salaire en alternance ? Faites une simulation sur le portail de l’alternance. En savoir plus </ListItem>
              <ListItem mb={4}>
                Le Précis de l’apprentissage vous présente des repères sur l’apprentissage. Il est issu des travaux de la DGEFP et d’une consultation des acteurs institutionnels de
                l’apprentissage. Il répond à l’objectif d’harmoniser les pratiques des acteurs de l’apprentissage et vise à donner des repères juridiques et des clefs de
                compréhension autour de bases documentaires et méthodologiques communes.
              </ListItem>
            </UnorderedList>
          </Box>
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem borderTop="1px solid" borderTopColor="#DDD">
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            À propos des aides financières et matérielles
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          <Box>
            <UnorderedList>
              <ListItem mb={4}>Vous avez besoin de passer le permis ? Bénéficiez d'au moins 500€ d'aide dès maintenant. En savoir plus</ListItem>
              <ListItem mb={4}>
                {" "}
                Certaines communes mettent à disposition des logements pour l'hébergement des alternants. Renseignez-vous en contactant la mairie de votre lieu de résidence.
              </ListItem>
              <ListItem mb={4}> Vous devez quitter le domicile familial pour vos études ? Action Logement vous aide à vous installer. En savoir plus</ListItem>
              <ListItem mb={4}>
                {" "}
                La plupart des régions aident au financement des abonnements en transport en commun pour les alternants : renseignez-vous auprès de votre mairie et de votre
                opérateur de transport !
              </ListItem>
              <ListItem mb={4}> De nombreuses aides existent pour les jeunes : pour les connaître, faites une simulation sur 1 jeune 1 solution ! En savoir plus</ListItem>
            </UnorderedList>
          </Box>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

export default ConseilsEtAstuces
