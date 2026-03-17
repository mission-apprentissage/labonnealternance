import { Typography } from "@mui/material"
import type { Metadata } from "next"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
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
      allerPlusLoinItems={[]}
      parentPage={PAGES.static.guideAlternant}
      page={PAGES.static.guideAlternantLaRuptureDeContrat}
    >
      <Section title="Peut-on rompre un contrat d'apprentissage ?">
        <Paragraph>
          Oui, un contrat d'apprentissage peut être rompu librement pendant les 45 premiers jours, par l’une de ses deux parties, en entreprise, puis uniquement par accord mutuel,
          « démission » éventuellement, a minima pour faute grave, inaptitude médicale définitive ou obtention du titre ou du diplôme qui constitue l’objet du contrat.{" "}
        </Paragraph>
        <Paragraph>
          Pendant les 45 premiers jours de présence en entreprise, vous pouvez rompre votre contrat librement : pas besoin de donner une raison, pas de préavis, pas d'indemnité à
          verser. Votre employeur peut faire de même.
        </Paragraph>
        <Paragraph>Attention : seuls les jours passés en entreprise comptent. Les semaines en CFA ne sont pas incluses.</Paragraph>
        <Paragraph>Seule formalité : la rupture doit être notifiée par écrit, puis sa copie doit être transmise au CFA et à l'OPCO concerné.</Paragraph>
      </Section>
      <Section title="Comment rompre un contrat d'apprentissage après les 45 jours ?">
        <Paragraph>
          Passé les 45 jours en entreprise, la rupture du contrat d'apprentissage n'est plus libre. Elle n'est possible que par accord mutuel, « démission » éventuellement, a
          minima faute grave, inaptitude médicale définitive ou obtention du titre ou du diplôme qui constitue l’objet du contrat.
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
          Votre employeur ne peut pas vous licencier pour motif économique, comme un salarié « classique ». Il ne peut rompre le contrat que pour des motifs précis : faute grave a
          minima de votre part, inaptitude médicale constatée par le médecin du travail, exclusion définitive du CFA, ou cas de force majeure. Et ce en respectant les règles
          procédurales concernées par le motif choisi.
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
                Contactez d'abord le médiateur de l'apprentissage (rattaché à la CCI, CMA ou chambre d'agriculture de votre département). Il dispose de 15 jours maximum pour
                intervenir.
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
          Le contrat d'apprentissage suit un régime spécifique, notamment avec 45 jours de liberté puis des cas de rupture limités. Le contrat de professionnalisation obéit au «
          droit commun » des CDD.
        </Paragraph>
        <Paragraph>
          Dans cette dernière hypothèse, après éventuellement une période « d'essai », la rupture n'est possible que par accord mutuel, a minima en cas de faute grave, d’inaptitude
          médicale définitive sans possibilité de reclassement, de force majeure, ou si vous avez décroché un CDI ailleurs.
        </Paragraph>
      </Section>
      <Section title="Quels sont les droits d'un « alternant » après une rupture de contrat ?">
        <Paragraph>
          Après la rupture d'un contrat d'apprentissage, l'alternant peut poursuivre, s’il le souhaite, sa formation au CFA pendant 6 mois et bénéficier des allocations chômage
          s'il a travaillé au moins 4 mois sur les 28 derniers mois.
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
          Oui. Pendant les 45 premiers jours en entreprise, la rupture est libre et sans motif. Après ce délai, elle n'est possible que par accord mutuel, démission via le
          médiateur de l'apprentissage éventuellement, a minima faute grave, inaptitude médicale définitive ou obtention du diplôme.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight="bold">Comment « démissionner » d'un contrat d'apprentissage ?</Typography>
          L'apprenti doit saisir le médiateur de l'apprentissage (s’il existe) (CCI, CMA ou chambre d'agriculture), attendre 5 jours calendaires, puis informer son employeur par
          écrit. La rupture prend effet 7 jours calendaires après cette notification. Pour un apprenti mineur, l'acte de rupture doit être cosigné par le représentant légal.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight="bold">Qu'est-ce que le médiateur de l'apprentissage ? </Typography>
          Quand il existe, le médiateur de l'apprentissage est un intervenant rattaché aux chambres consulaires (CCI, CMA, chambre d'agriculture) qui intervient obligatoirement
          avant toute démission d'un apprenti. Il dispose de 15 jours maximum pour agir.{" "}
        </Paragraph>
        <Paragraph>
          <Typography fontWeight="bold">Quels sont les droits d'un apprenti après une rupture de contrat ?</Typography>
          Il/elle peut poursuivre sa formation au CFA pendant 6 mois et bénéficier des allocations chômage (ARE) s'il a travaillé au moins 4 mois sur les 28 derniers mois.
          L'employeur doit lui remettre le certificat de travail, l'attestation France Travail et le solde de tout compte.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight="bold">Quelle est la différence entre rupture d'un contrat d'apprentissage et de professionnalisation ?</Typography>
          Le contrat d'apprentissage suit un régime spécifique, notamment avec 45 jours de liberté puis des cas de rupture limités par le code du travail. Le contrat de
          professionnalisation obéit au « droit commun » des CDD, avec des règles de rupture différentes selon la forme du contrat. Dans tous les cas, les procédures exigées par ce
          code doivent être respectées.
        </Paragraph>
        <Paragraph>
          Sources : code du travail, notamment en ses articles{" "}
          <DsfrLink
            href="https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000006195912/#LEGISCTA000006195912"
            aria-label="Consulter les articles legifrance"
          >
            L6222-18 à L6222-22
          </DsfrLink>{" "}
          (apprentissage). Informations en vigueur au 1er février 2026.
        </Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default LaRuptureDeContratPage
