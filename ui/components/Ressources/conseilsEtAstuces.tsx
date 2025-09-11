import { fr } from "@codegouvfr/react-dsfr"
import { Accordion } from "@codegouvfr/react-dsfr/Accordion"
import { Box, List, ListItem, Typography } from "@mui/material"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

const accordions = [
  {
    title: "Pour définir votre projet",
    content: (
      <Box>
        <List sx={{ listStyleType: "disc", pl: 2 }}>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            <Typography fontWeight={700} component="span">
              Vous ne savez pas vers quel métier vous orienter ?{" "}
              <Typography component="span">
                Faites le point avec Diagoriente, un service qui vous accompagne dans la construction de votre orientation professionnelle.{" "}
                <DsfrLink href="https://diagoriente.beta.gouv.fr/">C'est parti !</DsfrLink>
              </Typography>
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            <Typography fontWeight={700} component="span">
              L’alternance augmente d'environ 10% vos chances de trouver un emploi en sortie de formation
            </Typography>
            , par rapport à une formation scolaire. Et ce, car l'alternance vous permet d'acquérir une première expérience professionnelle. En contrepartie, c’est un mode de
            formation exigeant qui implique un rythme de travail professionnel, avec des congés limités et non plus de vacances scolaires.
          </ListItem>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            <Typography fontWeight={700} component="span">
              Des doutes sur votre orientation ?
            </Typography>{" "}
            Pensez à la Prépa-apprentissage : un dispositif qui vous permet de découvrir un ou plusieurs métiers !{" "}
            <DsfrLink href="https://travail-emploi.gouv.fr/le-ministere-en-action/pic/prepa-apprentissage-pic">En savoir plus</DsfrLink>
          </ListItem>
        </List>
      </Box>
    ),
  },
  {
    title: "Pour vous faire accompagner par des conseillers",
    content: (
      <Box>
        <List sx={{ listStyleType: "disc", pl: 2 }}>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            <Typography fontWeight={700} component="span">
              Contactez la Mission locale de votre secteur.
            </Typography>{" "}
            Des conseillers vous aideront dans vos recherches d'entreprise.{" "}
            <DsfrLink href="https://www.unml.info/le-reseau/annuaire/" aria-label="Accéder au site pour trouver une mission locale">
              Trouver ma mission locale
            </DsfrLink>
          </ListItem>

          <ListItem sx={{ display: "list-item", mb: 2 }}>
            <Typography fontWeight={700} component="span">
              L'ANAF (Association Nationale des Apprentis de France)
            </Typography>{" "}
            peut vous aider à tout moment de votre parcours et pour toute question que vous vous posez !{" "}
            <DsfrLink href="https://www.anaf.fr/apprentissage/" aria-label="Accéder au site de l'ANAF">
              En savoir plus
            </DsfrLink>
          </ListItem>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            <Typography fontWeight={700} component="span">
              Un mentor (ancien alternant ou adulte actif inséré dans la vie professionnelle)
            </Typography>{" "}
            peut vous épauler tout au long de votre parcours et suivant vos besoins !{" "}
            <DsfrLink href="https://www.mentorat-apprentissage.fr/" aria-label="Accéder au site mentorat apprentissage">
              En savoir plus sur le programme de l'ANAF
            </DsfrLink>/ 
            <DsfrLink href="https://www.jobirl.com/e-mentorat/e-mentorat-jeunes-stage-alternance" aria-label="Accéder au site job irl">
              En savoir plus sur le programme de Jobirl
            </DsfrLink>
          </ListItem>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Profitez d'un accompagnement proche de chez vous pour votre parcours et vos démarches avec{" "}
            <DsfrLink href="https://www.1jeune1solution.gouv.fr/accompagnement" aria-label="Accéder au site d'un jeune une solution">
              1 jeune 1 solution
            </DsfrLink>
          </ListItem>
        </List>
      </Box>
    ),
  },
  {
    title: "À propos des formations en alternance",
    content: (
      <Box>
        <List sx={{ listStyleType: "disc", pl: 2 }}>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            <Typography fontWeight={700} component="span">
              La plupart des organismes de formations font des journées portes ouvertes :
            </Typography>{" "}
            vous y trouverez l'occasion d'échanger avec des alternants !
          </ListItem>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Combien de personnes ont trouvé un emploi dans les 6 mois après avoir obtenu le diplôme que vous souhaitez préparer ? La réponse ici !{" "}
            <DsfrLink href="https://www.inserjeunes.education.gouv.fr/diffusion/accueil" aria-label="Accéder au site d'inserjeunes">
              En savoir plus
            </DsfrLink>
          </ListItem>

          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Certains établissements de formation obtiennent des labels d'excellence, c'est par exemple le cas des CMQ (Campus des Métiers et Qualifications d'excellence).{" "}
            <DsfrLink href="https://www.education.gouv.fr/les-campus-des-metiers-et-des-qualifications-5075" aria-label="Accéder au site des campus métier">
              En savoir plus
            </DsfrLink>
          </ListItem>
        </List>
      </Box>
    ),
  },
  {
    title: "Pour trouver un employeur",
    content: (
      <Box>
        <List sx={{ listStyleType: "disc", pl: 2 }}>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Tout au long de l'année, il existe des salons de recrutement (physiques ou virtuels) spécialisés pour l'alternance : renseignez-vous ! <br />
            <DsfrLink href="https://www.letudiant.fr/etudes/salons.html" aria-label="Accéder à la liste des salons recensés par l'étudiant">
              Voir les salons l’Étudiant
            </DsfrLink>
            <br />
            <DsfrLink href="https://www.studyrama.com/salons" aria-label="Accéder à la liste des salons recensés par studyrama">
              Voir les salons Studyrama
            </DsfrLink>
            <br />
            <DsfrLink href="https://jeunesdavenirs.fr/nos-evenements/" aria-label="Accéder à la liste des salons recensés par jeunes d'avenir">
              Voir les salons Jeunes d’Avenirs
            </DsfrLink>
          </ListItem>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            France Travail recense de nombreux évènements (conférences, salons, job dating, conférences en ligne…) pour vous aider dans vos recherches de contrat.{" "}
            <DsfrLink href="https://mesevenementsemploi.francetravail.fr/mes-evenements-emploi/evenements" aria-label="Accéder au site des événement recencsé par France Travail">
              En savoir plus
            </DsfrLink>
          </ListItem>

          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Plus d’un employeur sur deux recrute sans déposer d'offre d'emploi : optimisez vos chances en adressant aussi des candidatures spontanées !
          </ListItem>
        </List>
      </Box>
    ),
  },
  {
    title: "Pour préparer vos candidatures",
    content: (
      <Box>
        <List sx={{ listStyleType: "disc", pl: 2 }}>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Besoin d'aide pour construire un CV à partir de vos expériences ? Inscrivez-vous gratuitement sur Diagoriente et laissez-vous guider dans la construction d'un CV
            pertinent, mettant en lumière vos compétences.{" "}
            <DsfrLink href="https://web-app.diagoriente.beta.gouv.fr/#/inscription?utm_source=lba&utm_campaign=lba-dec2021" aria-label="Accéder au guide CV de Diagoriente">
              En savoir plus
            </DsfrLink>
          </ListItem>

          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Besoin d'aide pour concevoir un beau CV ? Vous pouvez le faire gratuitement sur CVdesignr.{" "}
            <DsfrLink href="https://cvdesignr.com/fr" aria-label="Accéder au site cv designer point com">
              En savoir plus
            </DsfrLink>
          </ListItem>

          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Motivation, Dynamisme et Présentation soignée : 3 qualités recherchées par les employeurs de jeunes candidats. Mettez-les en avant dans votre candidature !
          </ListItem>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Les recruteurs font attention à de petits détails ! Professionnalisez vos candidatures en utilisant une adresse email adaptée aux contacts professionnels (par exemple :
            nom.prenom@email.fr et en personnalisant votre messagerie vocale sur votre téléphone (par exemple : “Bonjour, vous êtes bien sur la messagerie vocale de [prénom+nom].
            Je ne suis pas disponible pour le moment, laissez-moi un message et je vous rappellerai dès que possible. Merci !”)
          </ListItem>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Les employeurs qui embauchent des alternants reçoivent des aides,{" "}
            <DsfrLink href="https://entreprendre.service-public.fr/vosdroits/F23556" aria-label="Accéder au décret précisant les aides à l'embauche d'alternant">
              jusqu’à 6000€ selon le dernier décret
            </DsfrLink>{" "}
            : c'est un bon argument pour convaincre une entreprise qui ne connaît pas l'alternance de vous embaucher !
          </ListItem>
        </List>
      </Box>
    ),
  },
  {
    title: "À propos de votre rémunération",
    content: (
      <Box>
        <List sx={{ listStyleType: "disc", pl: 2 }}>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Se former en alternance ne vous coûte rien ! En plus de percevoir une rémunération, votre employeur prend en charge le financement de votre formation.
          </ListItem>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Quel sera votre salaire en alternance ? Faites une simulation sur le portail de l’alternance.{" "}
            <DsfrLink href="https://www.alternance.emploi.gouv.fr/simulateur-alternant/etape-1" aria-label="Accéder au simulateur de salaire en alternance">
              En savoir plus
            </DsfrLink>
          </ListItem>

          <ListItem sx={{ display: "list-item", mb: 2 }}>
            <DsfrLink href="https://travail-emploi.gouv.fr/IMG/pdf/precis-apprentissage.pdf" aria-label="Accéder au précis de l'apprentissage">
              Le Précis de l’apprentissage
            </DsfrLink>{" "}
            vous présente des repères sur l’apprentissage. Il est issu des travaux de la DGEFP et d’une consultation des acteurs institutionnels de l’apprentissage. Il répond à
            l’objectif d’harmoniser les pratiques des acteurs de l’apprentissage et vise à donner des repères juridiques et des clefs de compréhension autour de bases documentaires
            et méthodologiques communes.
          </ListItem>
        </List>
      </Box>
    ),
  },
  {
    title: "À propos des aides financières et matérielles",
    content: (
      <Box>
        <List sx={{ listStyleType: "disc", pl: 2 }}>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Vous avez besoin de passer le permis ? Bénéficiez d'au moins 500€ d'aide dès maintenant.{" "}
            <DsfrLink href="https://mes-aides.francetravail.fr/transport-et-mobilite/financer-mon-permis" aria-label="Accéder au site mes aides de France travail">
              En savoir plus
            </DsfrLink>
          </ListItem>

          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Certaines communes mettent à disposition des logements pour l'hébergement des alternants. Renseignez-vous en contactant la mairie de votre lieu de résidence.
          </ListItem>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            Vous devez quitter le domicile familial pour vos études ? Action Logement vous aide à vous installer.{" "}
            <DsfrLink href="https://www.actionlogement.fr/moment-de-vie/trouver-un-logement" aria-label="Accéder au site actionlogement">
              En savoir plus
            </DsfrLink>
          </ListItem>

          <ListItem sx={{ display: "list-item", mb: 2 }}>
            La plupart des régions aident au financement des abonnements en transport en commun pour les alternants : renseignez-vous auprès de votre mairie et de votre opérateur
            de transport !
          </ListItem>
          <ListItem sx={{ display: "list-item", mb: 2 }}>
            De nombreuses aides existent pour les jeunes : pour les connaître, faites une simulation sur 1 jeune 1 solution !{" "}
            <DsfrLink href="https://mes-aides.1jeune1solution.beta.gouv.fr/?utm_source=labonnealternance" aria-label="Accéder au site de un jeune une solution">
              En savoir plus
            </DsfrLink>
          </ListItem>
        </List>
      </Box>
    ),
  },
]

const ConseilsEtAstuces = () => {
  return (
    <div className={fr.cx("fr-accordions-group")}>
      {accordions.map(({ content, title }) => (
        <Accordion key={title} label={title}>
          {content}
        </Accordion>
      ))}
    </div>
  )
}

export default ConseilsEtAstuces
