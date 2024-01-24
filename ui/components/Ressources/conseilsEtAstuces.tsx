import { Accordion, AccordionButton, AccordionItem, AccordionPanel } from "@chakra-ui/react"

const ConseilsEtAstuces = () => {
  return (
    <Accordion defaultIndex={[0]} allowMultiple>
      <AccordionItem>
        <AccordionButton>Pour définir votre projet</AccordionButton>
        <AccordionPanel>
          é
          <ul>
            <li>
              Vous ne savez pas vers quel métier vous orienter ? Faites le point avec Diagoriente, un service qui vous accompagne dans la construction de votre orientation
              professionnelle. C'est parti !{" "}
            </li>
            <li>
              L’alternance augmente d'environ 10% vos chances de trouver un emploi en sortie de formation, par rapport à une formation scolaire. Et ce, car l'alternance vous permet
              d'acquérir une première expérience professionnelle. En contrepartie, c’est un mode de formation exigeant qui implique un rythme de travail professionnel, avec des
              congés limités et non plus de vacances scolaires.
            </li>
            <li>Des doutes sur votre orientation ? Pensez à la Prépa-apprentissage : un dispositif qui vous permet de découvrir un ou plusieurs métiers ! En savoir plus</li>
          </ul>
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem>
        <AccordionButton>Pour vous faire accompagner par des conseillers</AccordionButton>
        <AccordionPanel>
          <ul>
            <li>Contactez la Mission locale de votre secteur. Des conseillers vous aideront dans vos recherches d'entreprise. Trouver ma mission locale </li>
            <li>
              L'ANAF (Association Nationale des Apprentis de France) peut vous aider à tout moment de votre parcours et pour toute question que vous vous posez ! En savoir plus{" "}
            </li>
            <li>
              Un mentor (ancien alternant ou adulte actif inséré dans la vie professionnelle) peut vous épauler tout au long de votre parcours et suivant vos besoins ! En savoir
              plus
            </li>
            <li>Profitez d'un accompagnement proche de chez vous pour votre parcours et vos démarches avec 1 jeune 1 solution</li>
          </ul>
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem>
        <AccordionButton>À propos des formations en alternance</AccordionButton>
        <AccordionPanel>
          La plupart des organismes de formations font des journées portes ouvertes : vous y trouverez l'occasion d'échanger avec des alternants ! Combien de personnes ont trouvé
          un emploi dans les 6 mois après avoir obtenu le diplôme que vous souhaitez préparer ? La réponse ici ! En savoir plus Certains établissements de formation obtiennent des
          labels d'excellence, c'est par exemple le cas des CMQ (Campus des Métiers et Qualifications d'excellence). En savoir plus
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem>
        <AccordionButton>Pour trouver un employeur</AccordionButton>
        <AccordionPanel>
          Tout au long de l'année, il existe des salons de recrutement (physiques ou virtuels) spécialisés pour l'alternance : renseignez-vous ! Voir les salons l’Étudiant Voir les
          salons Studyrama France Travail recense de nombreux évènements (conférences, salons, job dating, conférences en ligne…) pour vous aider dans vos recherches de contrat. En
          savoir plus La loi « Avenir professionnel » a étendu les possibilités de faire un contrat en alternance à l’étranger, dans ou hors de l’Union européenne. Cela vous
          intéresse ? Découvrir les offres d'emploi à l'étranger Le secteur public (mairies, ministères, départements, régions, ...) recrute aussi des alternants, pensez-y ! En
          savoir plus Plus d’un employeur sur deux recrute sans déposer d'offre d'emploi : optimisez vos chances en adressant aussi des candidatures spontanées !
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <AccordionButton>Pour préparer vos candidatures</AccordionButton>
        <AccordionPanel>
          Besoin d'aide pour construire un CV à partir de vos expériences ? Inscrivez-vous gratuitement sur Diagoriente et laissez-vous guider dans la construction d'un CV
          pertinent, mettant en lumière vos compétences. En savoir plus Besoin d'aide pour concevoir un beau CV ? Vous pouvez le faire gratuitement sur CVdesignr. En savoir plus
          Motivation, Dynamisme et Présentation soignée : 3 qualités recherchées par les employeurs de jeunes candidats. Mettez-les en avant dans votre candidature ! Les recruteurs
          font attention à de petits détails ! Professionnalisez vos candidatures en utilisant une adresse email adaptée aux contacts professionnels (par exemple :
          nom.prenom@email.fr et en personnalisant votre messagerie vocale sur votre téléphone (par exemple : “Bonjour, vous êtes bien sur la messagerie vocale de [prénom+nom]. Je
          ne suis pas disponible pour le moment, laissez-moi un message et je vous rappellerai dès que possible. Merci !”)
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <AccordionButton>À propos de votre rémunération</AccordionButton>
        <AccordionPanel>
          Les employeurs qui embauchent des alternants reçoivent des aides, jusqu’à 6000€ selon le dernier décret : c'est un bon argument pour convaincre une entreprise qui ne
          connaît pas l'alternance de vous embaucher ! Télécharger le fichier de suivi de candidatures Pour faciliter le suivi de vos candidatures, téléchargez et complétez notre
          modèle de fichier de suivi. Ne ratez plus aucune opportunité ! Se former en alternance ne vous coûte rien ! En plus de percevoir une rémunération, votre employeur prend
          en charge le financement de votre formation. Quel sera votre salaire en alternance ? Faites une simulation sur le portail de l’alternance. En savoir plus Le Précis de
          l’apprentissage vous présente des repères sur l’apprentissage. Il est issu des travaux de la DGEFP et d’une consultation des acteurs institutionnels de l’apprentissage.
          Il répond à l’objectif d’harmoniser les pratiques des acteurs de l’apprentissage et vise à donner des repères juridiques et des clefs de compréhension autour de bases
          documentaires et méthodologiques communes.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <AccordionButton>À propos des aides financières et matérielles</AccordionButton>
        <AccordionPanel>
          Vous avez besoin de passer le permis ? Bénéficiez d'au moins 500€ d'aide dès maintenant. En savoir plus Certaines communes mettent à disposition des logements pour
          l'hébergement des alternants. Renseignez-vous en contactant la mairie de votre lieu de résidence. Vous devez quitter le domicile familial pour vos études ? Action
          Logement vous aide à vous installer. En savoir plus La plupart des régions aident au financement des abonnements en transport en commun pour les alternants :
          renseignez-vous auprès de votre mairie et de votre opérateur de transport ! De nombreuses aides existent pour les jeunes : pour les connaître, faites une simulation sur 1
          jeune 1 solution ! En savoir plus
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

export default ConseilsEtAstuces
