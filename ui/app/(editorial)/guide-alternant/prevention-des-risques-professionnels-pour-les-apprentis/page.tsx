import type { Metadata } from "next"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { Section } from "@/app/(editorial)/_components/Section"

export const metadata: Metadata = PAGES.static.guideAlternantPreventionDesRisquesProfessionnelsPourLesApprentis.getMetadata()

const PreventionDesRisquesProfessionnelsPourLesApprentisPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantPreventionDesRisquesProfessionnelsPourLesApprentis]

  const descriptionParts = [
    "En alternant enseignements théoriques et immersion en entreprise, les apprentis acquièrent des compétences professionnelles tout en découvrant les réalités du monde du travail. Toutefois, leur manque d’expérience et leur jeune âge peuvent davantage les exposer aux risques professionnels. La prévention de ces risques est donc un enjeu majeur et les futurs apprentis doivent pouvoir se renseigner sur le sujet.",
    "Les apprentis doivent être conscients des risques liés à la découverte de nouveaux environnements de travail, de machines, d’outils et de substances parfois dangereuses. Une meilleure connaissance des dangers professionnels, une anticipation des situations à risque permet à l’apprenti de prévenir ces risques professionnels.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["prevention-des-risques-professionnels-pour-les-apprentis"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["prevention-des-risques-professionnels-pour-les-apprentis"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      allerPlusLoinItems={[ARTICLES["comprendre-la-remuneration"], ARTICLES["la-rupture-de-contrat"], ARTICLES["se-faire-accompagner"]]}
    >
      <Section title="Obligations des employeurs d’apprentis">
        <Paragraph>L’employeur a une obligation légale de sécurité envers tous ses salariés, y compris les apprentis. À ce titre, il doit :</Paragraph>
        <ParagraphList
          listItems={[
            "évaluer les risques professionnels et les consigner dans le document unique d’évaluation des risques professionnels (DUERP) qui est mis à disposition des salariés ;",
            "mettre en œuvre des actions de prévention adaptées ;",
            "informer et former l’apprenti aux risques liés aux missions qui lui seront confiées ;",
            "fournir et faire utiliser les équipements de protection individuelle (EPI) ;",
            "encadrer strictement les activités réglementées, notamment pour les apprentis mineurs.",
          ]}
        />
        <Paragraph>Ces obligations s’inscrivent dans les priorités des politiques publiques de santé au travail.</Paragraph>
        <Paragraph>
          L’accueil de l’apprenti en entreprise est une étape déterminante de la prévention. Il peut comprendre, entre autres, la fourniture des équipements professionnels, la
          présentation des consignes de sécurité et du règlement intérieur, l’identification des risques spécifiques au poste de travail, une formation pratique aux gestes
          professionnels sûrs, l’explication des procédures d’urgence et de déclaration des accidents.
        </Paragraph>
        <Paragraph>
          En entreprise, le rôle du maître d’apprentissage est également central puisqu'il est un acteur clé de la prévention sur le terrain. Il accompagne l’apprenti au quotidien
          et veille à lui transmettre les bonnes pratiques en matière de sécurité, contrôler l’application des consignes et adapter les tâches confiées au niveau de formation.
        </Paragraph>
      </Section>
      <Section title="Rôle des centres de formations d’apprentis (CFA)">
        <Paragraph>
          Les centres de formation d’apprentis (CFA) jouent également un rôle fondamental dans la prévention des risques professionnels. Ils ont en effet une obligation de
          sensibilisation à la santé et à la sécurité au travail, intégrée aux parcours de formation.
        </Paragraph>
        <Paragraph>Cette sensibilisation vise à :</Paragraph>
        <ParagraphList
          listItems={[
            "transmettre les bases réglementaires de la prévention des risques professionnels ;",
            "développer chez les apprentis une culture de prévention dès l’entrée en formation ;",
            "permettre l’identification des risques communs et spécifiques aux métiers préparés ;",
            "sensibiliser aux droits et devoirs en matière de santé et de sécurité au travail ;",
            "aborder les risques émergents, notamment les risques psychosociaux et les troubles musculosquelettiques.",
          ]}
        />
        <Paragraph>
          Les CFA doivent également veiller à la cohérence entre les enseignements dispensés et les pratiques en entreprise, en lien avec le maître d’apprentissage.
        </Paragraph>
        <Paragraph>
          Ainsi, l'ensemble des acteurs partie prenante au parcours de l'apprenti en entreprise et en CFA doivent permettre à l’apprenti de s'impliquer dans sa propre sécurité, en
          lui apprenant à respecter les règles de sécurité, à porter les équipements professionnels mis à sa disposition, à ne pas réaliser une tâche sans formation préalable,
          entre autres.
        </Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default PreventionDesRisquesProfessionnelsPourLesApprentisPage
