import type { Metadata } from "next"
import { Typography } from "@mui/material"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { Section } from "@/app/(editorial)/_components/Section"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

export const metadata: Metadata = PAGES.static.guideAlternantRoleEtMissionsDuMaitreDApprentissageOuTuteur.getMetadata()

const RoleEtMissionsDuMaitreDApprentissageOuTuteurPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantRoleEtMissionsDuMaitreDApprentissageOuTuteur]

  const descriptionParts = [
    "Pendant votre alternance, vous serez accompagné par un maître d'apprentissage (en contrat d'apprentissage) ou un tuteur (en contrat de professionnalisation). Cette personne vous guidera au quotidien dans l'entreprise et fera le lien avec votre centre de formation pour assurer la cohérence entre ce que vous apprenez en cours et ce que vous faites en entreprise.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      allerPlusLoinItems={[ARTICLES["comprendre-la-remuneration"], ARTICLES["la-rupture-de-contrat"], ARTICLES["se-faire-accompagner"]]}
    >
      <Section>
        <Paragraph>
          Votre maître d'apprentissage ou tuteur est votre personne ressource dans l'entreprise. Il vous accueille dès votre arrivée, vous présente l'équipe et vous explique le
          fonctionnement de l'entreprise. Au quotidien, il vous confie des missions adaptées à votre niveau et au diplôme que vous préparez, vous montre les gestes et techniques du
          métier, et prend le temps de répondre à vos questions. Il vous aide à progresser en vous donnant des conseils et en faisant régulièrement le point sur ce que vous avez
          appris. C'est aussi lui qui fait le lien avec votre centre de formation : il échange avec vos formateurs sur votre évolution et s'assure que vos missions en entreprise
          correspondent bien à ce que vous étudiez en cours. En cas de difficulté ou de questionnement, n'hésitez pas à vous tourner vers lui : son rôle est justement de vous
          accompagner tout au long de votre alternance.
        </Paragraph>
        <Paragraph>
          <Typography component={"span"} fontWeight={"bold"}>
            Bon à savoir :{" "}
          </Typography>
          un maître d'apprentissage ou tuteur peut suivre maximum 2 apprentis en même temps (3 si l'un redouble). N’hésitez pas à alerter votre CFA si ce n’est pas le cas.
        </Paragraph>
      </Section>
      <Section title="En contrat d'apprentissage : le maître d'apprentissage">
        <Paragraph>
          Votre maître d'apprentissage travaille en lien avec votre CFA (centre de formation d'apprentis). Sa mission ? Vous aider à développer les compétences dont vous avez
          besoin pour obtenir votre diplôme ou titre professionnel.
        </Paragraph>
        <Paragraph>
          Il peut s'agir de votre employeur ou d'un salarié de l'entreprise. Pour être maître d'apprentissage, cette personne doit disposer de compétences et/ou d’expériences
          significatives dans le métier enseigné.
        </Paragraph>
        <Paragraph>
          En l’absence d’accord de branche (accord conclu entre un ou plusieurs groupements d'entreprises appartenant à un même secteur d'activité), les conditions pour être maître
          d’apprentissage sont les suivantes :
        </Paragraph>
        <ParagraphList
          listItems={[
            "soit avoir un diplôme du même domaine que le vôtre (de niveau équivalent ou supérieur) et au moins 1 an d'expérience dans le métier ;",
            "soit justifier d'au moins 2 ans d'expérience en lien avec votre formation",
          ]}
        />
      </Section>
      <Section title="En contrat de professionnalisation : le tuteur">
        <Paragraph>
          Votre tuteur est un salarié expérimenté et volontaire de l'entreprise. Votre employeur peut aussi être lui-même votre tuteur s'il remplit les conditions pour exercer
          cette fonction.
        </Paragraph>
        <Paragraph>
          Votre tuteur vous accompagne au quotidien : il vous accueille, répond à vos questions et vous guide dans vos missions. Il fait aussi le lien avec votre organisme de
          formation et participe au suivi de votre progression.
        </Paragraph>
      </Section>
      <Section title="En résumé :">
        <Paragraph>Le rôle de maître d’apprentissage ou de tuteur implique les missions suivantes :</Paragraph>
        <ParagraphList
          listItems={[
            "accueillir l’alternant et présenter l'entreprise et ses activités ;",
            "planifier les tâches de l’alternant au quotidien ;",
            "accompagner l’alternant dans sa découverte du métier ;",
            "évaluer l’acquisition de ses compétences professionnelles ;",
            "s'assurer qu'il travaille dans de bonnes conditions ;",
            "l’informer de l’ensemble des règles et usages internes.",
          ]}
        />
      </Section>
      <Section title="Que faire si la relation avec votre maître d'apprentissage ou tuteur ne se passe pas bien ?">
        <Paragraph>
          Il peut arriver que la relation avec votre maître d'apprentissage ou tuteur soit difficile : manque de disponibilité, communication compliquée, missions qui ne
          correspondent pas à votre formation... Si vous rencontrez des difficultés, ne restez pas seul face au problème.
        </Paragraph>
        <Paragraph>
          Commencez par en parler directement avec votre maître d'apprentissage ou tuteur de manière calme et constructive : expliquez-lui ce qui pose problème et ce dont vous
          auriez besoin.
        </Paragraph>
        <Paragraph>
          Si cela ne suffit pas, contactez votre centre de formation. Vos formateurs ou le responsable pédagogique peuvent servir de médiateurs et intervenir auprès de l'entreprise
          pour trouver des solutions. Vous pouvez également vous tourner vers la personne avec qui vous avez signé votre contrat en alternance puis vers le service RH de votre
          entreprise si elle en dispose.
        </Paragraph>
        <Paragraph>
          En dernier recours, si la situation ne s'améliore pas malgré ces démarches, vous pouvez contacter{" "}
          <DsfrLink href="https://www.service-public.gouv.fr/particuliers/vosdroits/F31633" aria-label="Contacter un médiateur de l'apprentissage">
            un médiateur de l'apprentissage.
          </DsfrLink>
        </Paragraph>
        <Paragraph>
          Le médiateur de l'apprentissage doit être saisi en cas de rupture par l'apprenti de son contrat d'apprentissage après les 45 premiers jours de formation pratique en
          entreprise
        </Paragraph>
        <Paragraph>
          Il peut également être contacté pour un accompagnement de l'employeur et de son apprenti à trouver à l'amiable une solution à leur litige concernant l'exécution du
          contrat.
        </Paragraph>
        <Paragraph>Rapprochez-vous de votre CFA pour faire la demande.</Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default RoleEtMissionsDuMaitreDApprentissageOuTuteurPage
