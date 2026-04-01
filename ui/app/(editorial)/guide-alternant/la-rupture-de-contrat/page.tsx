import { Typography } from "@mui/material"
import type { Metadata } from "next"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { RedirectionInterne } from "@/app/(editorial)/_components/RedirectionInterne"
import { Section } from "@/app/(editorial)/_components/Section"
import { TableArticle } from "@/app/(editorial)/_components/TableArticle"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideAlternantLaRuptureDeContrat.getMetadata()

const LaRuptureDeContratPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantLaRuptureDeContrat]

  const descriptionParts = [
    "Votre alternance se passe mal et vous pensez à tout arrêter ? Pas de panique. Rompre un contrat de formation en alternance est tout à fait possible, mais il y a des règles à respecter. Ce guide vous explique l'essentiel.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["la-rupture-de-contrat"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["la-rupture-de-contrat"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      redirectionInterne={<RedirectionInterne />}
      allerPlusLoinItems={[
        ARTICLES["preparer-son-projet-en-alternance"],
        ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"],
        ARTICLES["comment-signer-un-contrat-en-alternance"],
      ]}
      parentPage={PAGES.static.guideAlternant}
      page={PAGES.static.guideAlternantLaRuptureDeContrat}
    >
      <Section title="Peut-on rompre un contrat d'apprentissage ?">
        <Paragraph>
          Oui, un contrat d'apprentissage peut être rompu librement pendant les 45 premiers jours en entreprise, puis uniquement par accord mutuel, démission après avoir saisi le
          médiateur, faute grave, inaptitude ou obtention anticipée du diplôme.
        </Paragraph>
        <Paragraph>
          Pendant les 45 premiers jours de présence en entreprise, vous pouvez rompre votre contrat librement : pas besoin de donner une raison, pas de préavis, pas d'indemnité à
          verser. Votre employeur peut également rompre le contrat de la même manière.
        </Paragraph>
        <Paragraph>
          Attention : seuls les jours passés en entreprise comptent. Les semaines en CFA ne sont pas incluses. Concrètement, ces 45 jours peuvent s'étaler sur 2 à 3 mois
          calendaires.
        </Paragraph>
        <Paragraph>Seule formalité : la rupture doit être notifiée par écrit (lettre recommandée ou remise en main propre), puis transmise au CFA et à l'OPCO.</Paragraph>
      </Section>
      <Section title="Comment rompre un contrat d'apprentissage après les 45 jours ?">
        <Paragraph>
          Passé les 45 jours en entreprise, la rupture du contrat d'apprentissage est possible par accord mutuel entre l’apprenti et son employeur, démission après avoir saisi le
          médiateur de l'apprentissage, faute grave, inaptitude médicale ou obtention anticipée du diplôme.
        </Paragraph>
        <Paragraph component="h3" variant="body1" fontWeight={"bold"}>
          La rupture d'un commun accord
        </Paragraph>
        <Paragraph>
          C'est la solution la plus simple. Vous vous mettez d'accord avec votre employeur pour mettre fin au contrat à une date déterminée. Il suffit de signer ensemble un
          document de rupture amiable (
          <DsfrLink
            href="https://code.travail.gouv.fr/modeles-de-courriers/rupture-dun-contrat-dapprentissage-dun-commun-accord"
            aria-label="Consulter le modèle de de document de rupture amiable sur travail.gouv.fr"
          >
            un modèle est disponible sur le site travail.gouv.fr
          </DsfrLink>
          ), puis sa copie doit être transmise au CFA et à l'OPCO concerné.
        </Paragraph>
        <Paragraph component="h3" variant="body1" fontWeight={"bold"}>
          La rupture par l'employeur
        </Paragraph>
        <Paragraph>
          Votre employeur ne peut pas vous licencier comme un salarié classique. Il ne peut rompre le contrat que pour des motifs précis : faute grave de votre part, inaptitude
          médicale constatée par le médecin du travail, exclusion définitive du CFA, ou cas de force majeure.
        </Paragraph>
        <Paragraph component="h3" variant="body1" fontWeight={"bold"}>
          L'obtention du titre ou du diplôme
        </Paragraph>
        <Paragraph>Si vous décrochez votre titre ou diplôme avant la fin prévue du contrat, vous pouvez partir en respectant un préavis d'un mois minimum.</Paragraph>
      </Section>
      <Section title="Comment « démissionner » d'un contrat d'apprentissage ?">
        <Paragraph>
          L'apprenti doit d'abord saisir le médiateur de l'apprentissage quand il existe, attendre 5 jours calendaires, puis informer son employeur par écrit. La rupture prend
          effet 7 jours après cette notification.
        </Paragraph>
        <Paragraph>Voici la procédure détaillée en 3 étapes :</Paragraph>
        <ParagraphList
          listItems={[
            <>
              <Typography fontWeight="bold">Étape 1 : Saisir le médiateur de l'apprentissage (quand il existe).</Typography>
              <Typography>
                Contactez d'abord le médiateur de l'apprentissage (rattaché à la Chambre de commerce et d'industrie, Chambres de métiers et de l'artisanat ou Chambre d'agriculture
                de votre département). Il dispose de 15 jours maximum pour intervenir.
              </Typography>
            </>,
            <>
              <Typography fontWeight="bold">Étape 2 : Informer votre employeur.</Typography>
              <Typography>
                Après un délai minimum de 5 jours calendaires suivant la saisine du médiateur, vous pouvez informer votre employeur de votre intention de rompre le contrat.
              </Typography>
            </>,
            <>
              <Typography fontWeight="bold">Étape 3 : Respecter le préavis.</Typography>
              <Typography>La rupture prend effet au minimum 7 jours calendaires après la date à laquelle votre employeur a été informé.</Typography>
            </>,
          ]}
        />
        <Paragraph>
          <Typography component="span" fontWeight="bold">
            Si vous êtes mineur :
          </Typography>{" "}
          l'acte de rupture doit être cosigné par votre représentant légal. S'il ne répond pas, vous pouvez solliciter le médiateur pour débloquer la situation.
        </Paragraph>
      </Section>
      <Section title="Tableau récapitulatif : rupture du contrat d'apprentissage">
        <TableArticle
          headers={["Situation", "Qui peut rompre", "Préavis", "Indemnités"]}
          data={[
            [<Typography fontWeight="bold">Pendant les 45 jours</Typography>, "Employeur ou apprenti", "Aucun", "Aucune"],
            [<Typography fontWeight="bold">Accord commun</Typography>, "Les deux parties", "Selon accord", "Selon accord"],
            [<Typography fontWeight="bold">« Démission » apprenti</Typography>, "Apprenti", "7 jours min.", "Aucune"],
            [<Typography fontWeight="bold">Faute grave</Typography>, "Employeur", "Aucun", "Aucune"],
            [<Typography fontWeight="bold">Obtention diplôme</Typography>, "Apprenti", "1 mois", "Aucune"],
            [<Typography fontWeight="bold">Liquidation judiciaire</Typography>, "Liquidateur", "Aucun", "Oui (versées par le liquidateur)"],
          ]}
        />
      </Section>
      <Section title="Quelle est la différence entre rupture d'un contrat d'apprentissage et de professionnalisation ?">
        <Paragraph>
          Le contrat d'apprentissage suit un régime spécifique avec 45 jours pendant lesquels la rupture est possible sans motif puis des cas de rupture limités. Le contrat de
          professionnalisation obéit au droit commun des CDD ou CDI.
        </Paragraph>
        <Paragraph>
          En CDD : après la période d'essai, la rupture n'est possible que par accord mutuel, en cas de faute grave, d'inaptitude médicale, de force majeure, ou si vous avez
          décroché un CDI ailleurs.
        </Paragraph>
        <Paragraph>
          En CDI : vous pouvez démissionner à tout moment en respectant le préavis prévu par votre contrat ou votre convention collective. Une rupture conventionnelle est aussi
          envisageable.
        </Paragraph>
      </Section>
      <Section title="Quels sont les droits d'un « alternant » après une rupture de contrat ?">
        <Paragraph>
          Après la rupture d'un contrat d'apprentissage, l'alternant peut poursuivre sa formation au CFA et bénéficier{" "}
          <DsfrLink
            href="https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocati/lessentiel-a-savoir-sur-lallocat/ai-je-droit-a-lallocation-chomag.html"
            aria-label="Consulter les droits aux allocations chômage sur le site France Travail"
          >
            des allocations chômage
          </DsfrLink>{" "}
          selon certaines conditions.
        </Paragraph>
        <Paragraph>Le CFA doit aussi l’aider à trouver un nouvel employeur.</Paragraph>
        <Paragraph>Pensez à vous inscrire à France Travail dès que possible.</Paragraph>
        <Paragraph>
          Dans tous les cas, l’employeur doit obligatoirement vous remettre : le certificat de travail, l'attestation France Travail, le reçu pour solde de tout compte.
        </Paragraph>
      </Section>
      <Section title="5 conseils avant de rompre votre contrat">
        <ParagraphList
          ordered
          listItems={[
            <>
              <Typography fontWeight="bold" component="span">
                Dialoguez d'abord :
              </Typography>{" "}
              <Typography>un conflit peut souvent se résoudre par la discussion. Votre CFA peut jouer un rôle de médiateur.</Typography>
            </>,
            <>
              <Typography fontWeight="bold" component="span">
                Documentez les problèmes :
              </Typography>{" "}
              <Typography>si vous subissez des manquements de l'employeur, gardez des preuves (emails, SMS, témoignages). </Typography>
            </>,
            <>
              <Typography fontWeight="bold" component="span">
                Anticipez la suite :
              </Typography>{" "}
              <Typography>avez-vous un plan B ? Un nouvel employeur ? Une autre formation ?</Typography>
            </>,
            <>
              <Typography fontWeight="bold" component="span">
                Consultez votre CFA :
              </Typography>{" "}
              <Typography>il peut vous conseiller sur la procédure et vous accompagner dans vos démarches.</Typography>
            </>,
            <>
              <Typography fontWeight="bold" component="span">
                Respectez les procédures :
              </Typography>{" "}
              <Typography>une rupture dans les règles vous protège juridiquement et préserve vos droits (chômage, formation...).</Typography>
            </>,
          ]}
        />
      </Section>
      <Section title="Questions fréquentes">
        <Paragraph>
          <Typography fontWeight="bold">Peut-on rompre un contrat d'apprentissage ?</Typography>
          Oui. Pendant les 45 premiers jours en entreprise, la rupture est libre et sans motif. Après ce délai, elle n'est possible que par accord mutuel, démission après avoir
          saisi le médiateur de l'apprentissage, faute grave, inaptitude médicale ou obtention anticipée du diplôme.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight="bold">Comment « démissionner » d'un contrat d'apprentissage ?</Typography>
          L'apprenti doit saisir le médiateur de l'apprentissage (Chambre de commerce et d'industrie, Chambres de métiers et de l'artisanat ou Chambre d'agriculture), attendre 5
          jours calendaires, puis informer son employeur par écrit. La rupture prend effet 7 jours calendaires après cette notification. Pour un apprenti mineur, l'acte de rupture
          doit être cosigné par le représentant légal.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight="bold">Qu'est-ce que le médiateur de l'apprentissage ? </Typography>
          Le médiateur de l'apprentissage est un intervenant rattaché aux chambres consulaires (Chambre de commerce et d'industrie, Chambres de métiers et de l'artisanat, chambre
          d'agriculture) qui intervient obligatoirement avant toute démission d'un apprenti. Il dispose de 15 jours maximum pour agir.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight="bold">Quelle est la différence entre rupture d'un contrat d'apprentissage et de professionnalisation ?</Typography>
          Le contrat d'apprentissage suit un régime spécifique avec 45 jours pendant lesquels la rupture est possible sans motif puis des cas de rupture limités par le Code du
          travail. Le contrat de professionnalisation obéit au droit commun des CDD ou CDI, avec des règles de rupture différentes selon la forme du contrat.
        </Paragraph>
        <Paragraph>
          Sources :{" "}
          <DsfrLink
            href="https://www.legifrance.gouv.fr/search/code?tab_selection=code&searchField=ALL&query=&page=1&init=true&nomCode=mjXqUg%3D%3D"
            aria-label="Consulter le code du travail sur le site Légifrance"
          >
            code du travail
          </DsfrLink>
          , notamment les articles dédiés à l'apprentissage.
        </Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default LaRuptureDeContratPage
