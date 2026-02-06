import type { Metadata } from "next"
import { Box, Typography } from "@mui/material"
import { fr } from "@codegouvfr/react-dsfr"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { Section } from "@/app/(editorial)/_components/Section"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { InfoSection } from "@/app/(editorial)/_components/InfoSection"

export const metadata: Metadata = PAGES.static.guideAlternantPreparerSonProjetEnAlternance.getMetadata()

const PreparerSonProjetEnAlternancePage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantPreparerSonProjetEnAlternance]

  const descriptionParts = [
    "L’alternance augmente significativement vos chances de trouver un emploi en sortie de formation, par rapport à une formation scolaire. En effet, l'alternance vous permet d'acquérir une première expérience professionnelle. En contrepartie, c’est un mode de formation exigeant qui implique un rythme de travail professionnel, avec des congés limités, différents du rythme scolaire.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["preparer-son-projet-en-alternance"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["preparer-son-projet-en-alternance"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      allerPlusLoinItems={[ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"], ARTICLES["comment-signer-un-contrat-en-alternance"], ARTICLES["se-faire-accompagner"]]}
    >
      <Section>
        <Paragraph bold>Les étapes clés :</Paragraph>
        <ParagraphList
          listItems={[
            "Choisir le métier vers lequel se tourner ;",
            "choisir entre le contrat d’apprentissage et le contrat de professionnalisation ;",
            "rechercher une entreprise en vue de signer un contrat ;",
            "repérer l’organisme de formation susceptible de vous accueillir ;",
            "connaître les aides pour se former en alternance.",
          ]}
          ordered
        />
      </Section>
      <Section>
        <Paragraph bold>Rôle en tant qu'alternant :</Paragraph>
        <ParagraphList
          listItems={[
            "suivre avec assiduité la formation et se présenter aux examens ;",
            "bien s'intégrer dans l'entreprise, effectuer les travaux indiqués et en lien avec le métier préparé, travailler pour la durée du contrat ;",
            "respecter les règles de fonctionnement et d'organisation de l'entreprise et de l'organisme de formation.",
          ]}
        />
      </Section>
      <Section title="Choisir le métier vers lequel se tourner">
        <Paragraph>Pour savoir quel métier choisir, la meilleure approche est encore de partir de vous et vos goûts personnels :</Paragraph>
        <Box sx={{ marginLeft: { md: fr.spacing("5w") }, xs: fr.spacing("2w") }}>
          <ParagraphList
            listItems={[
              "Faites le point sur vos centres d'intérêt et vos passions, même celles qui semblent éloignées du monde professionnel. Identifiez vos matières préférées à l'école et ce qui les rend motivantes ;",
              "réfléchissez aux activités où vous perdez la notion du temps tant vous y prenez plaisir ;",
              "identifiez vos points forts : préférez-vous travailler avec vos mains, réfléchir à des problèmes, être en contact avec les autres ?",
            ]}
          />
        </Box>
        <Paragraph>La plateforme de l’Onisep vous propose des quiz pour identifier les métiers faits pour vous ici et ici par exemple.</Paragraph>
        <Paragraph>
          <DsfrLink href={"https://diagoriente.fr/"}>Diagoriente</DsfrLink> est également un service qui vous accompagne dans la construction de votre orientation professionnelle.
          Le service propose des outils gratuits d'analyse et de valorisation de vos compétences afin de vous accompagner tout au long de votre parcours scolaire et professionnel.
        </Paragraph>
        <Paragraph>Une fois que vous avez une idée de métier, explorez concrètement la réalité de ce métier :</Paragraph>
        <ParagraphList
          listItems={[
            <>
              En rencontrant des professionnels pour découvrir la réalité quotidienne des métiers (stages d'observation, immersions professionnelles, journées découvertes):{" "}
              <DsfrLink href={"https://www.myjobglasses.com/webinars/"}>Myjobglasses</DsfrLink> vous propose de découvrir des métiers, en vidéo ou en rencontrant des
              professionnels. <DsfrLink href="https://immersion-facile.beta.gouv.fr/">Immersion facilitée</DsfrLink> simplifie les démarches administratives pour vous permettre de
              faire des immersions en entreprise ;
            </>,
            "en participant à des forums des métiers, des portes ouvertes d'établissements, etc. ;",
            "regardez des vidéos témoignages de professionnels pour avoir un aperçu concret.",
          ]}
        />
        <Paragraph>
          Nous vous conseillons d’explorer plusieurs domaines avant de faire votre choix. Ne vous limitez pas qu’aux métiers que vous connaissez déjà ou que pratiquent vos proches,
          explorez d’autres horizons.
        </Paragraph>
      </Section>
      <Section title="Choisir entre le contrat d’apprentissage et le contrat de professionnalisation">
        <Paragraph>Les critères de choix :</Paragraph>
        <ParagraphList listItems={["Votre âge et votre statut sur le marché du travail"]} />
        <Paragraph bold component="h3" variant="h4">
          Contrat d'apprentissage :
        </Paragraph>
        <ParagraphList
          listItems={[
            "jeunes âgés de 16 à 29 ans révolus ;",
            <>
              certains publics peuvent entrer en apprentissage au-delà de 29 ans (les apprentis préparant un diplôme ou titre supérieur à celui obtenu, les personnes reconnues
              travailleur handicapé{" > "}
              <DsfrLink href="https://travail-emploi.gouv.fr/le-contrat-dapprentissage-amenage">en savoir plus sur le contrat d’apprentissage aménagé</DsfrLink> ; les personnes
              ayant un projet de création ou de reprise d’entreprise nécessitant le diplôme ou titre visé) ; les sportifs de haut niveau ;
            </>,
            "les personnes entrant dans leur 16ème année (15 ans et un jour), si elles ont terminé leur cycle du collège (brevet obtenu ou pas), peuvent commencer à exécuter un contrat d’apprentissage.",
          ]}
        />
        <Paragraph bold component="h3" variant="h4">
          Contrat de professionnalisation :
        </Paragraph>
        <ParagraphList
          listItems={[
            "Pour les jeunes âgés de 16 à 25 ans ;",
            "les demandeurs d’emploi âgés de 26 ans et plus ;",
            "bénéficiaires du revenu de solidarité active (RSA), de l’allocation de solidarité spécifique ou de l’allocation aux adultes handicapés (AAH) ;",
            "personnes ayant bénéficié d’un contrat aidé (contrat unique d’insertion - CUI) ;",
            "l’objectif poursuivi par la formation.",
          ]}
        />
        <Paragraph>
          Le <DsfrLink href="https://travail-emploi.gouv.fr/le-contrat-dapprentissage">contrat d’apprentissage</DsfrLink> a pour but d’obtenir un diplôme d'État (CAP, BAC, BTS,
          Licence, Master,…) ou un titre à finalité professionnelle inscrit au répertoire national des certifications professionnelles (
          <DsfrLink href={"https://www.francecompetences.fr/recherche-resultats/?types=certification&search=&pageType=certification&active=1"}>RNCP</DsfrLink>), dont l’ensemble des
          titres professionnels relevant du ministère chargé de l’emploi.
        </Paragraph>
        <Paragraph>
          Le <DsfrLink href="https://travail-emploi.gouv.fr/le-contrat-de-professionnalisation">contrat de professionnalisation</DsfrLink> a pour but d'acquérir une qualification
          professionnelle reconnue (un diplôme ou un titre professionnel enregistré dans le Répertoire national des certifications professionnelles –{" "}
          <DsfrLink href={"https://www.francecompetences.fr/recherche-resultats/?types=certification&search=&pageType=certification&active=1"}>RNCP</DsfrLink> ) ; un certificat de
          qualification professionnelle (CQP) ; une qualification reconnue dans les classifications d’une convention collective nationale.
        </Paragraph>
      </Section>
      <Section title="Rechercher une entreprise en vue de conclure un contrat de travail">
        <Paragraph>
          Sans entreprise pour vous embaucher, pas de contrat en alternance. La recherche de l’employeur est donc une étape clé dans votre projet. La plupart des formations en
          alternance débutant au mois de septembre, il est important de bien veiller à anticiper la recherche de l’entreprise qui pourra vous accueillir, éventuellement, plusieurs
          mois à l’avance.
        </Paragraph>
        <Paragraph>
          L'enjeu de la formation en alternance réside dans le choix de l'entreprise. Déterminante dans un cursus en alternance, la période d'immersion professionnelle occupe une
          place de premier plan sur le CV de l’alternant, ainsi que dans l'évolution de son projet professionnel.
        </Paragraph>
      </Section>
      <Section>
        <Paragraph component="h3" variant="h3">
          Qui peut vous aider ?
        </Paragraph>
        <Paragraph component="h4" variant="h4">
          1. L'établissement de formation :
        </Paragraph>
        <Paragraph>
          Très souvent les établissements de formation disposent de partenariats avec un certain nombre d’entreprises et peuvent vous mettre en contact avec elles.
        </Paragraph>
        <Paragraph component="h4" variant="h4">
          2. Multiplier les réseaux
        </Paragraph>
        <Paragraph>Pour que votre recherche ait le plus de chance d’aboutir, vous devez activer un maximum de leviers de recherche : </Paragraph>
        <ParagraphList
          listItems={[
            "Les salons et forums de recrutement ;",
            "France Travail ;",
            "les missions locales ;",
            "les chambres consulaires : chambres de commerce et d’industrie (CCI), chambres des métiers ou chambres d’agriculture ;",
            "les clubs d’anciens élèves de votre futur organisme de formation ;",
            "les sites des opérateurs de compétences ;",
            "les sites internet mis en place par les conseils régionaux ;",
          ]}
        />
      </Section>
      <InfoSection>
        <Paragraph>
          Dans le cadre du contrat d’apprentissage, les centres de formation d’apprentis (CFA) ont pour mission d’assister les jeunes postulants à l’apprentissage dans la recherche
          d’un employeur, et les apprentis en rupture anticipée de contrat dans la recherche d’un nouvel employeur.
        </Paragraph>
      </InfoSection>
      <Section>
        <Paragraph component="h3" variant="h3">
          Méthodologie pour contacter une entreprise
        </Paragraph>
        <ParagraphList
          listItems={[
            "Bien s’informer sur l’entreprise. Vous devez bien vous renseigner sur l’entreprise dans laquelle vous souhaitez postuler : son activité, ses métiers, ses valeurs, etc. ;",
            "rédiger un curriculum vitae (CV) mettant en avant vos diverses expériences et compétences acquises (y compris vos emplois saisonniers) ;",
            "rédiger une lettre de motivation claire, concise et accrocheuse. Votre organisme de formation peut être d’une aide précieuse ;",
            "une fois l’entretien d’embauche obtenu, il est important de bien le préparer pour être le plus convaincant possible et montrer vos réelles motivations pour le poste, sans oublier qu’il s’agit d’être formé pratiquement au regard de la formation théorique suivie.",
          ]}
        />
      </Section>
      <InfoSection>
        <Box display={"flex"} flexDirection={"column"} gap={2}>
          <Paragraph>
            Pour vous entraîner à contacter les entreprises, vous pouvez tester vos connaissances avec nos quiz de mise en situation :{" "}
            <DsfrLink href="https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e">Chercher un employeur</DsfrLink> et{""}
            <DsfrLink href="https://dinum.didask.com/courses/demonstration/60d1adbb877dae00003f0eac">Préparer un entretien avec un employeur</DsfrLink>
          </Paragraph>
          <Paragraph>
            Pour plus de conseils sur la lettre de motivation, découvrez{" "}
            <DsfrLink href="https://labonnealternance.sites.beta.gouv.fr/blog-la-bonne-alternance/lettre-de-motivation-pour-une-alternance-mod%C3%A8les-et-conseils/">
              notre article dédié
            </DsfrLink>
          </Paragraph>
        </Box>
      </InfoSection>
      <Section>
        <Paragraph component="h3" variant="h3">
          Le rôle de l’employeur
        </Paragraph>
        <ParagraphList
          listItems={[
            "Favoriser l’insertion professionnelle de l’alternant dans l'entreprise ;",
            "désigner un tuteur ou au maître d’apprentissage et lui permettre  d’assurer l’accompagnement de l’alternant, tout en exécutant sa propre  prestation de travail (décharge horaire par exemple) ;",
            "former l'alternant au métier choisi (formation pratique) ;",
            "donner les disponibilités à l'alternant pour suivre la formation théorique en organisme de formation ;",
            "rémunérer l'alternant pour son travail, en respectant le minimum légal.",
          ]}
        />
        <Paragraph>
          En tant que salarié de l'entreprise, votre employeur doit vous garantir certaines conditions de travail, tels que le respect du nombre d'heures travaillées et le droit
          aux congés.
        </Paragraph>
      </Section>
      <Section title="Repérer l’organisme de formation susceptible de vous accueillir">
        <Paragraph>
          Pour trouver une formation en apprentissage, plusieurs étapes sont à suivre. Vous pouvez tout d’abord vous renseigner sur les métiers qui vous plaisent et les diplômes
          accessibles en apprentissage. Pour cela, vous pouvez en parler à votre entourage et vos professeurs, consulter le site de l’ONISEP, ou encore vous rendre aux journées
          portes ouvertes ou dans des salons dédiés à l’alternance.
        </Paragraph>
        <Paragraph>
          Pour vous aider dans votre recherche, vous pouvez utiliser le catalogue des formations disponible sur{" "}
          <DsfrLink href="https://www.1jeune1solution.gouv.fr/formations/apprentissage">cette page</DsfrLink>.
        </Paragraph>
        <Paragraph>
          Une fois la formation choisie, il faut s’y inscrire en respectant les modalités définies par l’organisme de formation. Il est possible de débuter une formation en
          apprentissage à n’importe quel moment de l’année mais la plupart des formations débutant au mois de septembre, les inscriptions se font au printemps. De nombreux
          établissements utilisent la procédure d’affectation via Affelnet ou Parcoursup.
        </Paragraph>
      </Section>
      <Section title="Connaître les aides pour se former en alternance">
        <Paragraph>En tant qu’alternant, vous pouvez prétendre à plusieurs avantages :</Paragraph>
        <ParagraphList
          listItems={[
            <>
              <Typography component="span" variant="body1" fontWeight={"bold"}>
                La carte d’étudiant des métiers
              </Typography>
              <Typography component="span" variant="body1">
                , délivrée par l’établissement de formation pour la durée de votre formation. Elle vous donne accès à de nombreux avantages et réductions financières.
                Systématiquement délivrée pour le contrat d’apprentissage, sous conditions pour le contrat de professionnalisation.
              </Typography>
            </>,
          ]}
        />
        <InfoSection>
          <Paragraph>
            Vous êtes organisme de formation ? Rendez-vous dans <DsfrLink href="/espace-pro/authentification">votre espace connecté</DsfrLink> pour télécharger la carte d’étudiant
            des métiers.
          </Paragraph>
        </InfoSection>
        <ParagraphList
          listItems={[
            <>
              <Typography component="span" variant="body1" fontWeight={"bold"}>
                L’aide au permis de conduire pour les apprentis :{" "}
              </Typography>
              <Typography component="span" variant="body1">
                les apprentis majeurs peuvent bénéficier d’une aide de 500 euros pour le financement du permis de conduire ;
              </Typography>
            </>,
            <>
              <Typography component="span" variant="body1" fontWeight={"bold"}>
                le simulateur d'aides financières :{" "}
              </Typography>
              <Typography component="span" variant="body1">
                <DsfrLink href="https://www.1jeune1solution.gouv.fr/aides-financieres/simulateur">le site 1jeune1solution</DsfrLink> vous propose un simulateur pour découvrir
                toutes les aides auxquelles vous avez droit ;
              </Typography>
            </>,
            <>
              <Typography component="span" variant="body1" fontWeight={"bold"}>
                les impôts sur le revenu :{" "}
              </Typography>
              <Typography component="span" variant="body1">
                en contrat d’apprentissage, les salaires versés sont exonérés d’impôt sur le revenu dans la limite du montant annuel du Smic.{" "}
              </Typography>
            </>,
          ]}
        />
        <Paragraph>
          Si vous êtes apprenti, les régions proposent souvent des aides complémentaires : achat de matériel professionnel, réductions sur les transports, mobilité à
          l'international, etc. Pour les connaître, vous pouvez consulter le site internet de votre région.
        </Paragraph>
        <Box display={"flex"} flexDirection={"column"} gap={fr.spacing("1v")} color={fr.colors.decisions.text.title.grey.default}>
          <Typography>
            <DsfrLink href="https://www.auvergnerhonealpes.fr/">AUVERGNE-RHÔNE-ALPES</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.bourgognefranchecomte.fr/">BOURGOGNE-FRANCHE-COMTÉ</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.bretagne.bzh/">BRETAGNE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.centre-valdeloire.fr/">CENTRE-VAL DE LOIRE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.isula.corsica/">CORSE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.grandest.fr/">GRAND EST</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.regionguadeloupe.fr/">GUADELOUPE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.ctguyane.fr/">GUYANE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.hautsdefrance.fr/">HAUTS-DE-FRANCE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.iledefrance.fr/">ÎLE-DE-FRANCE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.collectivitedemartinique.mq/">MARTINIQUE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.mayotte.fr/">MAYOTTE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.normandie.fr/">NORMANDIE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.nouvelle-aquitaine.fr/">NOUVELLE-AQUITAINE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.laregion.fr/">OCCITANIE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.paysdelaloire.fr/">PAYS DE LA LOIRE</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.maregionsud.fr/">PROVENCE-ALPES-CÔTE D'AZUR (PACA)</DsfrLink>
          </Typography>
          <Typography>
            <DsfrLink href="https://www.regionreunion.com/">RÉUNION</DsfrLink>
          </Typography>
        </Box>
      </Section>
    </LayoutArticle>
  )
}

export default PreparerSonProjetEnAlternancePage
