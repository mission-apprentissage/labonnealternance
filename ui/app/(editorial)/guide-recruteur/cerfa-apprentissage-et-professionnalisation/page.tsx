import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import type { Metadata } from "next"
import { DescriptionSection } from "@/app/(editorial)/_components/DescriptionSection"
import { InfoSection } from "@/app/(editorial)/_components/InfoSection"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { ParagraphList } from "@/app/(editorial)/_components/ParagraphList"
import { RedirectionInterne } from "@/app/(editorial)/_components/RedirectionInterne"
import { Section } from "@/app/(editorial)/_components/Section"
import { TableArticle } from "@/app/(editorial)/_components/TableArticle"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES as ARTICLES_PARTAGES } from "@/app/(editorial)/guide/const"
import { ARTICLES } from "@/app/(editorial)/guide-recruteur/const"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.getMetadata()

const CerfaApprentissageEtProfessionnalisationPage = () => {
  const pages = [PAGES.static.guideRecruteur, PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation]

  const descriptionParts = [
    "Le Cerfa est le formulaire officiel qui formalise le contrat d'alternance. Mal rempli, il peut retarder l'enregistrement du contrat et le versement des aides. Ce guide détaille champ par champ les formulaires (apprentissage et professionnalisation) pour éviter les erreurs les plus courantes.",
  ]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["cerfa-apprentissage-et-professionnalisation"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["cerfa-apprentissage-et-professionnalisation"].updatedAt} />}
      description={<DescriptionSection descriptionParts={descriptionParts} />}
      redirectionInterne={<RedirectionInterne source="guide-recruteur" />}
      allerPlusLoinItems={[
        ARTICLES["je-suis-employeur-public"],
        ARTICLES_PARTAGES["apprentissage-et-handicap"],
        ARTICLES_PARTAGES["prevention-des-risques-professionnels-pour-les-apprentis"],
      ]}
      sourceAllerPlusLoin="guide-recruteur"
      parentPage={PAGES.static.guideRecruteur}
      page={PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation}
    >
      <Section title="Les deux formulaires Cerfa">
        <ParagraphList
          listItems={[
            <>
              <Typography fontWeight={"bold"} component={"span"}>
                Contrat en apprentissage :
              </Typography>{" "}
              plus d’informations sur{" "}
              <DsfrLink href={"https://travail-emploi.gouv.fr/le-contrat-dapprentissage"} aria-label="consulter le site du Ministère du Travail pour le contrat d'apprentissage">
                le site du Ministère du Travail
              </DsfrLink>
              , et{" "}
              <DsfrLink href="https://www.service-public.gouv.fr/particuliers/vosdroits/R1319" aria-label="Consulter le site de Service Public pour le contrat d'apprentissage">
                service public
              </DsfrLink>
            </>,
            <>
              <Typography fontWeight={"bold"} component={"span"}>
                Contrat de professionnalisation :
              </Typography>{" "}
              plus d’informations sur{" "}
              <DsfrLink
                href={"https://travail-emploi.gouv.fr/le-contrat-de-professionnalisation"}
                aria-label="Consulter le site du Ministère du Travail pour le contrat de professionnalisation"
              >
                le site du Ministère du Travail
              </DsfrLink>
              , et{" "}
              <DsfrLink
                href="https://www.service-public.gouv.fr/particuliers/vosdroits/R10338"
                aria-label="Consulter le site de Service Public pour le contrat de professionnalisation"
              >
                service public
              </DsfrLink>
            </>,
          ]}
        />
        <InfoSection>Astuce : De nombreux OPCO proposent une saisie en ligne du Cerfa via leur portail. Cette option réduit les erreurs et accélère le traitement.</InfoSection>
      </Section>
      <Section title="Le Cerfa : contrat d'apprentissage">
        <Paragraph fontWeight={"bold"}>Structure du formulaire</Paragraph>
        <Paragraph>Le Cerfa comporte 6 rubriques principales :</Paragraph>
        <ParagraphList
          listItems={[
            "L'employeur",
            "L'apprenti(e)",
            "Le maître d'apprentissage",
            "Le contrat",
            "La formation et l’organisme de formation",
            "Cadre réservé à l'organisme en charge du dépôt du candidat",
          ]}
          ordered
        />
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Rubrique 1 : L'employeur
        </Paragraph>
        <TableArticle
          headers={["Champ", "Explications", "Erreurs fréquentes"]}
          data={[
            ["N° SIRET", "14 chiffres de l'établissement d'exécution", "Confondre SIREN (9 chiffres) et SIRET"],
            ["Dénomination", "Raison sociale exacte", "Utiliser un nom commercial"],
            ["Effectif salarié", "Effectif de l'entreprise (SIREN)", "Mettre l'effectif de l'établissement "],
            ["Code NAF", "4 chiffres + 1 lettre", "Laisser vide"],
            ["Convention collective", "IDCC (4 chiffres) ou intitulé", 'Indiquer "néant" si pas de CCN applicable'],
            ["Employeur spécifique", "Cocher si applicable (employeur public, etc.)", "Ne pas cocher quand nécessaire"],
          ]}
        />
        <Paragraph>
          Pour comprendre la distinction entre les différents types d’employeurs (privé et public), consultez{" "}
          <DsfrLink
            href="https://www.formulaires.service-public.gouv.fr/gf/getNotice.do?cerfaNotice=51649&cerfaFormulaire=10103"
            aria-label="Consulter la notice du cerfa apprentissage"
          >
            la notice du cerfa apprentissage
          </DsfrLink>{" "}
          (page 2)
        </Paragraph>
        <Paragraph fontWeight={"bold"}>Employeurs spécifiques (codes) :</Paragraph>
        <ParagraphList
          listItems={[
            "1 : Entreprise de travail temporaire",
            "2 : Groupement d'employeurs",
            "3 : Employeur saisonnier",
            "4 : Apprentissage familial",
            "5 : Employeur du secteur public",
          ]}
        />
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Rubrique 2 : L'apprenti(e)
        </Paragraph>
        <TableArticle
          headers={["Champ", "Explications", "Erreurs fréquentes"]}
          data={[
            ["Nom de naissance", "Majuscules", "Nom de naissance, pas d'usage"],
            ["NIR (n° sécu)", "13 chiffres + clé (2 chiffres)", "Vérifier la cohérence avec la date de naissance"],
            ["Nationalité", "1 = Française, 2 = UE, 3 = Autre", "Pour nationalité 3, vérifier le titre de séjour"],
            ["Situation avant contrat", "Code de 1 à 13", "Choisir la situation juste avant le contrat"],
            ["Handicap", "Cocher si RQTH", "Obligatoire pour majoration aide à 6 000 €"],
            ["Représentant légal", "Obligatoire si mineur", "Compléter nom, prénom et adresse"],
          ]}
        />
        <Paragraph>Codes situation avant contrat :</Paragraph>
        <ParagraphList
          listItems={[
            "1 : Scolaire",
            "2 : Prépa apprentissage",
            "3 : Étudiant",
            "4 : Contrat d'apprentissage",
            "5 : Contrat de professionnalisation",
            "6 : Contrat aidé",
            "7 : Salarié",
            "8 : Personne à la recherche d'un emploi",
            "9 : Inactif",
            "10 : Contrat de volontariat",
            "11 : Autre (préciser)",
          ]}
        />
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Rubrique 3 : Le maître d'apprentissage
        </Paragraph>
        <Paragraph>Deux maîtres d'apprentissage maximum peuvent être désignés.</Paragraph>
        <TableArticle
          headers={["Champs", "Règles"]}
          data={[
            ["Nom et prénom", "Obligatoire pour le MA n°1"],
            ["Date de naissance", "Pour vérifier qu’il remplit les conditions légales (majeur ou mineur, ...)"],
            ["Diplôme le plus élevé", "Code diplôme + intitulé"],
            ["Niveau diplôme", "De 01 (Doctorat) à 13 (Aucun diplôme)"],
            ["Titre ou diplôme dans domaine", "Cocher si le maître d'apprentissage a un diplôme dans le domaine enseigné"],
            ["Nombre d'années d'expérience", "Minimum requis selon diplôme du maître d'apprentissage"],
          ]}
        />
        <Paragraph fontWeight={"bold"}>Conditions du maître d'apprentissage :</Paragraph>
        <ParagraphList
          listItems={[
            "être majeur ;",
            "être salarié de l'entreprise ;",
            "posséder un diplôme au moins égal à celui préparé par l'apprenti + 1 an d'expérience ;",
            "OU 2 ans d'expérience professionnelle dans le métier (sans diplôme équivalent) ;",
            "maximum 2 apprentis + 1 redoublant par maître d'apprentissage",
          ]}
        />
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Rubrique 4 : Le contrat
        </Paragraph>
        <TableArticle
          headers={["Champ", "Options", "Commentaires"]}
          data={[
            ["Type de contrat", "11 = 1er contrat, 21 = Renouvellement, 31 = Suite de contrat", "Suite de contrat = nouveau contrat après un précédent rompu"],
            ["Type de dérogation", "Codes 11 à 60 selon situation", "Laisser vide si pas de dérogation"],
            ["Date de début", "JJ/MM/AAAA", "Premier jour de travail effectif"],
            ["Date de fin", "JJ/MM/AAAA", "Laissé vide si CDI"],
            ["Durée hebdomadaire", "Heures", "35h par défaut"],
            ["Travail sur machines dangereuses", "OUI/NON", "Déclaration préalable si mineur"],
            ["Rémunération", "% du SMIC ou SMC", "Vérifier les grilles en vigueur"],
          ]}
        />
        <Paragraph fontWeight={"bold"}>Types de dérogation courants :</Paragraph>
        <ParagraphList
          listItems={[
            "11 : Âge > 29 ans – travailleur handicapé ;",
            "12 : Âge > 29 ans – sportif de haut niveau ;",
            "21 : Réduction de durée ;",
            "22 : Allongement de durée ;",
            "50 : Début formation 3 mois avant/après rentrée",
          ]}
        />
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Rubrique 5 : La formation et l’organisme de formation
        </Paragraph>
        <Paragraph fontWeight={"bold"}>La formation :</Paragraph>
        <TableArticle
          headers={["Champ", "Format", "Attention"]}
          data={[
            ["Code diplôme", "8 caractères", "Vérifier sur le RNCP"],
            ["Intitulé précis du diplôme", "Texte", "Copier l'intitulé exact du RNCP"],
            ["Date de début de formation", "JJ/MM/AAAA", "Première journée au CFA"],
            ["Date prévue examen", "JJ/MM/AAAA", "Session d'examen visée"],
            ["Durée de la formation", "Heures/an", "Minimum 25% du temps de travail"],
          ]}
        />
        <Paragraph fontWeight={"bold"}>L’organisme de formation :</Paragraph>
        <TableArticle
          headers={["Champ", "Format"]}
          data={[
            ["Dénomination", "Nom officiel du CFA"],
            ["N° UAI", "7 chiffres + 1 lettre"],
            ["N° SIRET", "14 chiffres"],
            ["Adresse", "Adresse du CFA responsable"],
          ]}
        />
        <Paragraph fontWeight={"bold"}>Le visa du CFA :</Paragraph>
        <Paragraph>Cette rubrique est complétée et signée par le CFA avant transmission à l'OPCO. Le CFA atteste de la cohérence du contrat avec la formation.</Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Rubrique 6 : Cadre réservé à l'organisme en charge du dépôt du candidat
        </Paragraph>
        <Paragraph fontWeight={"bold"}>Signatures obligatoires :</Paragraph>
        <ParagraphList listItems={["L'employeur (ou son représentant avec délégation) ;", "L'apprenti(e) ;", "Le représentant légal si l'apprenti est mineur"]} />
        <Paragraph fontWeight={"bold"}>Chaque signataire doit dater et signer. Une signature électronique est valable.</Paragraph>
      </Section>
      <Section title="Le Cerfa : contrat de professionnalisation">
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Différences avec le cerfa apprentissage
        </Paragraph>
        <Paragraph>Le Cerfa de professionnalisation partage une structure similaire mais comporte des spécificités :</Paragraph>
        <TableArticle
          headers={["Élément", "Cerfa apprentissage", "Cerfa professionnalisation"]}
          data={[
            ["Tuteur/MA", "Maître d'apprentissage", "Tuteur"],
            ["Visa CFA", "Obligatoire", "Non prévu"],
            ["Programme formation", "Non joint", "À joindre obligatoirement"],
            ["Parcours de formation", "Formation initiale", "Formation continue"],
          ]}
        />
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Les rubriques spécifiques
        </Paragraph>
        <Paragraph fontWeight={"bold"}>Rubrique "Tuteur" :</Paragraph>
        <Paragraph>
          Le tuteur doit justifier d'au moins 2 ans d'expérience professionnelle dans la qualification visée. Il peut encadrer au maximum 3 salariés en contrat de
          professionnalisation ou d'apprentissage.
        </Paragraph>
        <Paragraph fontWeight={"bold"}>Rubrique "Qualification visée" :</Paragraph>
        <Paragraph>Contrairement à l'apprentissage (toujours un diplôme), le contrat pro peut viser :</Paragraph>
        <ParagraphList
          listItems={[
            "un diplôme ou titre inscrit au RNCP ;",
            "un Certificat de Qualification Professionnelle (CQP) ;",
            "une qualification reconnue par la convention collective de branche",
          ]}
        />
        <Paragraph fontWeight={"bold"}>Rubrique "Organisme de formation" :</Paragraph>
        <Paragraph>L'organisme doit être titulaire de la certification Qualiopi pour les actions de formation par alternance.</Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Documents à joindre au Cerfa
        </Paragraph>
        <ParagraphList
          listItems={[
            <>
              <Typography fontWeight={"bold"} component={"span"}>
                Programme de formation détaillant :
              </Typography>
              <ParagraphList listItems={["objectifs pédagogiques;", "contenus de la formation ;", "moyens pédagogiques ;", "modalités d'évaluation ;", "durée de la formation"]} />
            </>,
            <Typography fontWeight={"bold"} component={"span"}>
              Convention de formation entre l'employeur et l'organisme
            </Typography>,
            <Typography fontWeight={"bold"} component={"span"}>
              Document d'évaluation des acquis (le cas échéant)
            </Typography>,
          ]}
          ordered
        />
      </Section>
      <Section title="Erreurs bloquantes et comment les éviter">
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Erreurs les plus fréquentes
        </Paragraph>
        <TableArticle
          headers={["Erreur", "Conséquence", "Solution"]}
          data={[
            [
              "SIRET erroné ou inactif",
              "Rejet du contrat",
              <>
                Vérifier sur{" "}
                <DsfrLink href="https://annuaire-entreprises.data.gouv.fr/" aria-label="Consulter l'annuaire des entreprises">
                  l’annuaire des entreprises
                </DsfrLink>
              </>,
            ],
            ["NIR incomplet ou incohérent", "Blocage paiement aides", "Vérifier avec attestation sécu"],
            ["Rémunération inférieure au minimum", "Rejet du contrat", "Utiliser les grilles officielles"],
            ["Maître d'apprentissage non qualifié", "Refus d'enregistrement", "Vérifier diplômes et expérience"],
            ["Dates incohérentes", "Demande de correction", "Début contrat ≤ fin contrat"],
            ["Effectif salarié erroné", "Mauvais calcul de l'aide", "Indiquer l'effectif de l'entreprise (SIREN)"],
            ["Absence de visa CFA", "Contrat non traité", "Faire signer le CFA avant envoi"],
          ]}
        />
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Points de contrôle avant envoi
        </Paragraph>
        <Paragraph>✅ Le SIRET est actif et correspond à l'établissement d'exécution</Paragraph>
        <Paragraph>✅ Les dates de début/fin de contrat sont cohérentes</Paragraph>
        <Paragraph>✅ La date de début de formation est dans la fenêtre autorisée</Paragraph>
        <Paragraph>✅ La rémunération respecte les minima légaux</Paragraph>
        <Paragraph>✅ Le maître d'apprentissage remplit les conditions</Paragraph>
        <Paragraph>✅ Le Cerfa est signé par toutes les parties</Paragraph>
        <Paragraph>✅ Le CFA a visé le contrat (FA 13 uniquement)</Paragraph>
        <Paragraph>✅ Le programme de formation est joint (EJ 20 uniquement)</Paragraph>
      </Section>
      <Section title="Transmission à l'OPCO">
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Délai de transmission
        </Paragraph>
        <Paragraph>Le contrat doit être transmis à l'OPCO dans les 5 jours ouvrables suivant le début d'exécution.</Paragraph>
        <Paragraph>Délai maximum pour bénéficier des aides : 6 mois après la conclusion du contrat.</Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Modes de transmission
        </Paragraph>
        <TableArticle
          headers={["Canal", "Délai de traitement", "Recommandé"]}
          data={[
            ["Portail en ligne OPCO", "Le plus rapide", "✅ Oui"],
            ["Email avec PJ", "Variable", "⚠️ Selon OPCO"],
            ["Courrier postal", "Le plus lent", "❌ À éviter"],
          ]}
        />
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Ce que vérifie l'OPCO
        </Paragraph>
        <ParagraphList
          listItems={[
            <>
              <Typography fontWeight={"bold"} component={"span"}>
                Complétude :
              </Typography>{" "}
              Tous les champs obligatoires sont renseignés
            </>,
            <>
              <Typography fontWeight={"bold"} component={"span"}>
                Cohérence :{" "}
              </Typography>{" "}
              Dates, âge, rémunération sont logiques{" "}
            </>,
            <>
              <Typography fontWeight={"bold"} component={"span"}>
                Éligibilité :
              </Typography>{" "}
              L'employeur peut conclure un contrat d'alternance
            </>,
            <>
              <Typography fontWeight={"bold"} component={"span"}>
                Financement :
              </Typography>{" "}
              La formation est éligible à la prise en charge
            </>,
          ]}
          ordered
        />
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Délai de réponse
        </Paragraph>
        <ParagraphList
          listItems={[
            <>
              <Typography fontWeight={"bold"} component={"span"}>
                L'OPCO a 20 jours pour statuer.
              </Typography>{" "}
              Trois issues possibles :
              <ParagraphList
                listItems={[
                  <>
                    <Typography fontWeight={"bold"} component={"span"}>
                      Accord de prise en charge →
                    </Typography>{" "}
                    Le contrat est déposé auprès des services du ministère
                  </>,
                  <>
                    <Typography fontWeight={"bold"} component={"span"}>
                      Demande de pièces complémentaires →
                    </Typography>{" "}
                    Délai suspendu jusqu'à réception
                  </>,
                  <>
                    <Typography fontWeight={"bold"} component={"span"}>
                      Refus motivé →
                    </Typography>{" "}
                    Notifié aux parties, possibilité de correction et renvoi
                  </>,
                ]}
              />
            </>,
          ]}
          ordered
        />
      </Section>
      <Section title="Cas de l'avenant au contrat">
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Quand faire un avenant ?
        </Paragraph>
        <Paragraph>Un avenant est nécessaire pour modifier un élément essentiel du contrat en cours :</Paragraph>
        <ParagraphList
          listItems={[
            "changement de maître d'apprentissage ;",
            "modification de la durée du contrat ;",
            "changement de diplôme préparé ;",
            "changement de CFA ;",
            "modification de la rémunération (hors évolutions légales) ;",
            "changement d'établissement d'exécution",
          ]}
        />
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Le formulaire d'avenant
        </Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"} component={"span"}>
            Pour l'apprentissage :
          </Typography>{" "}
          Utiliser le Cerfa apprentissage en cochant la case "Avenant" et en indiquant le numéro du contrat initial.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"} component={"span"}>
            Pour le contrat pro :
          </Typography>{" "}
          Rédiger un avenant au contrat de travail et le transmettre à l'OPCO.
        </Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Délai de transmission de l'avenant
        </Paragraph>
        <Paragraph>L'avenant doit être transmis à l'OPCO dans les 5 jours suivant sa signature.</Paragraph>
      </Section>
      <Section title="Formulaire de rupture">
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Cerfa de rupture (apprentissage)
        </Paragraph>
        <Paragraph>En cas de rupture du contrat d'apprentissage après la période probatoire, les parties doivent compléter un formulaire de constat de rupture.</Paragraph>
        <Paragraph>Destinataires de la notification :</Paragraph>
        <ParagraphList listItems={["l'OPCO (sous 5 jours) ;", "le CFA (sans délai) ;", "la DREETS (pour les ruptures à l'initiative de l'employeur)"]} />
        <Paragraph>Le formulaire de rupture est disponible auprès des OPCO ou des CCI/CMA.</Paragraph>
        <Paragraph component={"h3"} variant={"h3"} color={fr.colors.decisions.text.default.info.default} fontWeight={"bold"}>
          Rupture du contrat de professionnalisation
        </Paragraph>
        <Paragraph>
          Pas de formulaire spécifique. La rupture suit les règles du droit du travail (CDD ou CDI) avec notification à l'OPCO, à l'organisme de formation et aux organismes
          sociaux.
        </Paragraph>
      </Section>
      <Section title="Ressources et contacts">
        <Paragraph fontWeight={"bold"}>Télécharger les formulaires</Paragraph>
        <ParagraphList
          listItems={[
            <DsfrLink
              href="https://www.service-public.gouv.fr/particuliers/vosdroits/R1319"
              aria-label="Consulter le site de Service Public pour télécharger le cerfa apprentissage"
            >
              Cerfa - Contrat d'apprentissage
            </DsfrLink>,
            <DsfrLink
              href="https://www.service-public.gouv.fr/particuliers/vosdroits/R10338"
              aria-label="Consulter le site de Service Public pour télécharger le cerfa contrat de professionnalisation"
            >
              Cerfa - Contrat de professionnalisation
            </DsfrLink>,
          ]}
        />
        <Paragraph>
          <Typography fontWeight={"bold"} component={"span"}>
            Identifier votre OPCO 👉
          </Typography>{" "}
          <DsfrLink href="https://quel-est-mon-opco.francecompetences.fr" aria-label="Consulter le site de France Compétences pour identifier votre OPCO">
            quel-est-mon-opco.francecompetences.fr
          </DsfrLink>
        </Paragraph>
        <Paragraph>Saisissez votre SIRET ou le code IDCC de votre convention collective pour trouver l'OPCO compétent.</Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"} component={"span"}>
            Vérifier un numéro SIRET 👉
          </Typography>{" "}
          <DsfrLink href="https://www.sirene.fr" aria-label="Consulter le site Sirene pour vérifier un numéro SIRET">
            sirene.fr
          </DsfrLink>{" "}
          - Annuaire officiel des entreprises
        </Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"} component={"span"}>
            Codes diplômes et RNCP 👉
          </Typography>{" "}
          <DsfrLink
            href="https://www.francecompetences.fr/recherche-resultats/?types=certification&search=&pageType=certification&active=1"
            aria-label="Consulter le site France Compétences pour rechercher des certifications et des diplômes"
          >
            France Compétences - RNCP
          </DsfrLink>
        </Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"} component={"span"}>
            Guide officiel employeurs 👉
          </Typography>{" "}
          <DsfrLink
            href="https://travail-emploi.gouv.fr/sites/travail-emploi/files/2025-04/Guide_employeurs_alternancemars2025.pdf"
            aria-label="Consulter le guide pratique alternance 2025 du Ministère du Travail"
          >
            Guide pratique alternance 2025
          </DsfrLink>{" "}
          (Ministère du Travail)
        </Paragraph>
      </Section>
      <Section title="FAQ technique">
        <Paragraph>
          <Typography fontWeight={"bold"}>Le contrat peut-il être antidaté ?</Typography>
          Non. La date de début du contrat doit correspondre au premier jour réel de travail. L'antidatage peut entraîner un refus d'enregistrement.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"}>Peut-on modifier un Cerfa déjà transmis à l'OPCO ?</Typography>
          Oui, tant que le contrat n'est pas définitivement enregistré. Contactez rapidement votre OPCO pour signaler l'erreur et transmettre un nouveau Cerfa corrigé.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"}>Le Cerfa doit-il être transmis en original ?</Typography>
          Non, une copie numérique (scan ou photo lisible) suffit. La signature électronique est acceptée.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"}>Que faire si l'apprenti n'a pas encore son numéro de sécurité sociale ?</Typography>
          Transmettre le contrat avec la mention "en cours d'immatriculation". L'OPCO pourra demander le NIR ultérieurement pour finaliser le dossier.
        </Paragraph>
        <Paragraph>
          <Typography fontWeight={"bold"}>Comment corriger une erreur de rémunération après enregistrement ?</Typography>
          Établir un avenant au contrat avec la rémunération corrigée. Si la rémunération était inférieure au minimum légal, régulariser les salaires en appliquant la grille légale
          depuis le début du contrat.
        </Paragraph>
        <Paragraph variant="caption">Sources : Ministère du Travail, Code du travail, notices Cerfa.</Paragraph>
      </Section>
    </LayoutArticle>
  )
}

export default CerfaApprentissageEtProfessionnalisationPage
