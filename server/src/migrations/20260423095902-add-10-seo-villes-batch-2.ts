// Migration : ajout de 10 nouvelles pages ville SEO (/alternance/ville/[ville]) — batch 2
//
// Villes ajoutées : Nancy, Angers, Brest, Orléans, Limoges, Caen, Le Mans, Besançon, Amiens, Pau
// Sélection basée sur les données Google Search Console — villes à fort volume de recherche non encore couvertes.
//
// À FAIRE POUR LE DÉPLOIEMENT :
//   1. Déposer ce fichier dans server/src/migrations/
//   2. Déposer 10 images dans ui/public/images/seo/ville/ :
//      nancy.png, angers.png, brest.png, orleans.png, limoges.png,
//      caen.png, le-mans.png, besancon.png, amiens.png, pau.png
//   3. Lancer : yarn migrations:up
//
// Le up() ci-dessous :
//   - insère les 10 villes dans seo_villes (pas de deleteMany — migration additive, les villes existantes sont préservées)
//   - appelle updateSEO() qui remplit automatiquement job_count, recruteur_count, cards, content.vie.activites
//     via les jobs CRON updateSeoVilleJobCounts + updateSeoVilleActivities

import { ObjectId } from "mongodb"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { updateSEO } from "@/jobs/seo/updateSEO"

const MON_LOGEMENT_ETUDIANT_LINK = `<a href="https://monlogementetudiant.beta.gouv.fr/trouver-un-logement-etudiant?utm_source=labonnealternance&utm_medium=referral&utm_campaign=partenariat_backlink&utm_content=page_ville" target="_blank" rel="noopener noreferrer" class="lba-link-external" aria-label="Consulter le site Mon Logement Étudiant (ouverture dans un nouvel onglet)">Mon Logement Étudiant</a>`

const villeData = [
  {
    ville: "Nancy",
    cp: "54000",
    slug: "nancy",
    region: "Grand Est",
    geopoint: {
      lat: 48.692054,
      long: 6.184417,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "capitale des Ducs de Lorraine",
        text: "Nancy, préfecture de Meurthe-et-Moselle et ancienne capitale des Ducs de Lorraine, constitue un cadre particulièrement attractif pour les alternants. Avec près de <strong>105 000 habitants</strong> dans la commune et plus de 260 000 dans la métropole du Grand Nancy, la ville offre une taille humaine tout en concentrant les fonctions d'une grande métropole universitaire. Son patrimoine architectural est remarquable, de la place Stanislas classée au patrimoine mondial de l'UNESCO à l'exceptionnel ensemble Art Nouveau issu de l'École de Nancy. La ville accueille plus de <strong>50 000 étudiants</strong> au sein de l'Université de Lorraine et de ses nombreuses écoles d'ingénieurs et de commerce (Mines Nancy, ENSGSI, ICN Business School), ce qui lui confère une ambiance jeune et dynamique toute l'année. Pour un alternant, Nancy représente un compromis solide entre coût de la vie maîtrisé, densité d'entreprises recrutant en apprentissage et proximité immédiate du Luxembourg, qui ouvre un marché de l'emploi transfrontalier particulièrement dynamique. La ville est par ailleurs reliée à Paris en 1h30 de TGV, ce qui facilite les déplacements professionnels et les entretiens en fin de contrat.",
        image: "nancy.png",
      },
      vie: {
        text: "Le tissu économique nancéien est <span style=\"font-weight: bold;color:#0063cb\">diversifié et solidement ancré autour de plusieurs filières porteuses</span>, ce qui multiplie les opportunités d'alternance. <ul><li><span style=\"font-weight: bold;color:#0063cb\">La santé, la pharmacie et les biotechnologies</span> constituent un pôle majeur avec le CHRU de Nancy (un des plus grands employeurs du Grand Est), l'Institut de Cancérologie de Lorraine et de nombreux laboratoires installés sur le technopôle de Nancy-Brabois.</li><li><span style=\"font-weight: bold;color:#0063cb\">Le numérique et l'ingénierie</span> sont particulièrement actifs autour du quartier d'affaires Nancy Grand Cœur et du technopôle Henri-Poincaré, avec des acteurs comme Sopra Steria, Capgemini, Atos et un écosystème dense de PME et de startups soutenu par l'incubateur Lorn'Tech.</li><li><span style=\"font-weight: bold;color:#0063cb\">La banque, l'assurance et les services aux entreprises</span> recrutent régulièrement en alternance, avec la Caisse d'Épargne Grand Est Europe, la BPALC, Groupama ou la MGEN.</li><li><span style=\"font-weight: bold;color:#0063cb\">L'industrie et la métallurgie</span> restent très présentes dans le bassin, portées par Saint-Gobain PAM, ArcelorMittal, Novacarb ou les équipementiers automobiles du sillon lorrain.</li><li>Enfin, <span style=\"font-weight: bold;color:#0063cb\">le commerce, la logistique, le secteur public et l'enseignement supérieur</span> complètent ce panorama, avec l'Université de Lorraine, les collectivités locales et de nombreux sièges régionaux qui ouvrent chaque année des centaines de contrats d'apprentissage.</li></ul><span style=\"font-weight: bold;color:#0063cb\">Avec un coût de la vie inférieur à la moyenne des grandes métropoles et la proximité du marché de l'emploi luxembourgeois</span>, Nancy offre aux alternants de bonnes perspectives de rémunération pendant le contrat comme d'embauche à la sortie.",
        activites: [],
      },
      mobilite: {
        text: 'Se déplacer à Nancy est <span style="font-weight: bold;color:#0063cb">simple et économique</span>, un atout important quand on partage sa semaine entre entreprise et centre de formation. Le réseau STAN dessert l\'ensemble de la métropole avec <span style="font-weight: bold;color:#0063cb">une ligne de tramway (T1)</span> qui traverse la ville du nord au sud et une trentaine de lignes de bus à forte fréquence, complétées par des lignes Résago et des navettes vers les pôles d\'activité du technopôle et de Brabois.<br /><br /><span style="font-weight: bold;color:#0063cb">L\'abonnement mensuel STAN jeune (-26 ans) coûte environ 27 euros</span>, et votre employeur prend en charge 50 % de ce montant dans le cadre de votre alternance, ce qui en fait l\'un des budgets transport les plus légers de France. La ville compte par ailleurs plus de <span style="font-weight: bold;color:#0063cb">130 km d\'itinéraires cyclables</span> et le service vélOstan\'lib propose des vélos en libre-service <span style="font-weight: bold;color:#0063cb">à partir d\'environ 25 euros par an</span> pour les abonnés longue durée, très pratique pour les trajets domicile-travail en centre-ville.<br /><br />La gare de Nancy-Ville, au cœur du centre, offre <span style="font-weight: bold;color:#0063cb">des connexions TGV vers Paris en 1h30</span>, Strasbourg en 1h20 et Luxembourg en 1h15, ainsi que des TER réguliers vers Metz (40 minutes) et l\'ensemble du sillon lorrain. Le centre-ville est largement piétonnier et entièrement accessible à pied autour de la place Stanislas.',
        transports: [
          { label: "Tramway T1", type: "tramway" },
          { label: "Bus STAN", type: "bus" },
          { label: "Pistes cyclables", type: "velo" },
          { label: "vélOstan'lib", type: "velo" },
          { label: "Gare TGV", type: "tgv" },
          { label: "Centre-ville piéton", type: "pieton" },
        ],
      },
      logement: {
        text: `Trouver un logement à Nancy <span style="font-weight: bold;color:#0063cb">reste nettement plus accessible</span> que dans la plupart des grandes métropoles françaises, un avantage décisif pour les alternants. Pour un studio, comptez entre 350 et 500 euros charges comprises selon le quartier et l'état du bien, et entre 500 et 700 euros pour un T2.<ul><li><span style="font-weight: bold;color:#0063cb">Le centre-ville et le quartier Saint-Léon</span>, autour de la gare et de la place Stanislas, offrent un accès immédiat aux commerces, aux entreprises tertiaires et aux lignes de tram et de bus, avec des loyers un peu plus élevés.</li><li><span style="font-weight: bold;color:#0063cb">Les quartiers Haussonville, Saurupt et Boudonville</span> sont appréciés pour leur proximité avec les campus universitaires et leur ambiance résidentielle.</li><li><span style="font-weight: bold;color:#0063cb">Villers-lès-Nancy et Vandœuvre-lès-Nancy</span> concentrent une grande partie des résidences étudiantes et sont très bien reliés au centre par le tram et les bus, pratiques pour les alternants qui travaillent sur le technopôle de Brabois.</li><li><span style="font-weight: bold;color:#0063cb">Les quartiers Trois-Maisons et Poincaré</span> proposent des loyers parmi les plus abordables, à pied ou à vélo du centre.</li></ul><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches 1 à 2 mois avant la rentrée</span> via les plateformes classiques (Leboncoin, PAP, Studapart) et les agences locales. Les résidences CROUS et privées (Studéa, Nexity Studéa) constituent une alternative pratique, souvent meublée, à partir d'environ 400 euros. Rendez-vous aussi sur ${MON_LOGEMENT_ETUDIANT_LINK}, un service public ayant pour objectif de faciliter l'accès au logement étudiant pour découvrir plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style="font-weight: bold;color:#0063cb">N'oubliez pas que vous pouvez bénéficier des APL</span>, qui réduisent le loyer de 100 à 200 euros selon vos revenus, et du dispositif Visale (garantie locative gratuite pour les moins de 30 ans) qui facilite grandement la constitution du dossier.`,
        loyers: [
          { type: "Studio", price_range: "350 - 500€" },
          { type: "T2", price_range: "500 - 700€" },
        ],
      },
      loisirs: {
        text: 'Nancy offre une vie culturelle et étudiante <span style="font-weight: bold;color:#0063cb">particulièrement dense pour une ville de sa taille</span>, de quoi garder un bon équilibre entre travail, études et temps libre.<ul><li><span style="font-weight: bold;color:#0063cb">La place Stanislas, la place de la Carrière et le parc de la Pépinière</span> forment le cœur de la ville et constituent des lieux de promenade et de rassemblement privilégiés des alternants, à deux pas des commerces et des bibliothèques universitaires.</li><li><span style="font-weight: bold;color:#0063cb">Les musées (Musée des Beaux-Arts, Musée de l\'École de Nancy, Muséum-Aquarium)</span> proposent des tarifs réduits ou gratuits pour les moins de 26 ans, avec une programmation régulière d\'expositions temporaires.</li><li>La vie nocturne se concentre sur <span style="font-weight: bold;color:#0063cb">la place Saint-Epvre, la Grande-Rue et les rues du centre médiéval</span>, avec de nombreux bars étudiants, cafés-concerts et brasseries ouverts tard en semaine.</li><li><span style="font-weight: bold;color:#0063cb">La scène musicale</span> s\'appuie sur L\'Autre Canal (salle des musiques actuelles), le Zénith de Nancy, l\'Opéra national de Lorraine et de nombreuses salles associatives qui programment concerts et festivals toute l\'année.</li><li><span style="font-weight: bold;color:#0063cb">Les amateurs de sport</span> profitent d\'infrastructures municipales nombreuses, de clubs actifs comme l\'AS Nancy Lorraine ou le SLUC Nancy Basket (Pro B), ainsi que des berges aménagées de la Meurthe et du canal pour courir ou faire du vélo.</li><li>Des rendez-vous comme <span style="font-weight: bold;color:#0063cb">le Livre sur la Place, Nancy Jazz Pulsations ou le festival NJP</span> rythment l\'année et attirent un public étudiant important.</li></ul>',
        types: [
          { label: "Parcs et patrimoine", type: "promenade" },
          { label: "Musées et expositions", type: "musee" },
          { label: "Vie nocturne", type: "bar" },
          { label: "Concerts et festivals", type: "concert" },
          { label: "Sport", type: "sport" },
          { label: "Shopping", type: "shopping" },
        ],
      },
    },
  },
  {
    ville: "Angers",
    cp: "49000",
    slug: "angers",
    region: "Pays de la Loire",
    geopoint: {
      lat: 47.478419,
      long: -0.563166,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "capitale de l'Anjou",
        text: "Angers, préfecture du Maine-et-Loire et cœur historique de l'Anjou, compte près de <strong>155 000 habitants</strong> et environ <strong>415 000 habitants</strong> dans sa communauté urbaine (Angers Loire Métropole). Située à seulement 1h30 de Paris en TGV et 1h de Nantes, la ville bénéficie d'une position centrale dans l'Ouest de la France. Son patrimoine exceptionnel, marqué par le château fort aux 17 tours qui abrite la tenture de l'Apocalypse, la cathédrale Saint-Maurice et le quartier médiéval de la Doutre, côtoie une métropole moderne en plein développement autour du quartier Saint-Serge et du futur quartier Cours Saint-Laud. Avec plus de <strong>40 000 étudiants</strong> répartis entre l'Université d'Angers, l'ESSCA, l'ESA, l'ESAIP et de nombreuses écoles spécialisées, la ville affiche une ambiance jeune et dynamique. Pour un alternant, Angers combine un coût de la vie parmi les plus abordables des grandes villes françaises, un tissu économique diversifié porté par le végétal, le numérique et les services, et une qualité de vie régulièrement saluée dans les classements nationaux.",
        image: "angers.png",
      },
      vie: {
        text: 'Le tissu économique angevin est <span style="font-weight: bold;color:#0063cb">diversifié et porté par plusieurs filières d\'excellence</span>, ce qui en fait un bassin d\'alternance particulièrement actif.<ul><li><span style="font-weight: bold;color:#0063cb">La filière du végétal</span> est la signature d\'Angers, avec le pôle de compétitivité Végépolys Valley qui fédère plus de 400 entreprises autour de l\'horticulture, des semences, de la production agricole et de l\'agroalimentaire : Vilmorin, Hortival Diffusion, Ecole Supérieure d\'Agricultures (ESA) et de nombreuses PME recrutent régulièrement des alternants en production, marketing et R&D.</li><li><span style="font-weight: bold;color:#0063cb">Le numérique et la French Tech</span> se structurent autour de la French Tech Angers et de la Cité de l\'Objet Connecté, avec des acteurs comme Eviden (ex-Atos), Evolis, Scalian ou Sopra Steria qui recherchent des alternants en développement, data et cybersécurité.</li><li><span style="font-weight: bold;color:#0063cb">L\'assurance, la banque et la mutualité</span> emploient des milliers de salariés à Angers : Groupama Loire Bretagne, Crédit Mutuel Anjou, CNP Assurances et Giboire proposent régulièrement des contrats en relation client, actuariat, gestion et audit.</li><li><span style="font-weight: bold;color:#0063cb">L\'industrie et la logistique</span> restent solides avec Bosch, Scania, Thales, Valeo et Bolloré Logistics, ainsi qu\'un tissu dense de PMI sous-traitantes.</li><li>Enfin, <span style="font-weight: bold;color:#0063cb">la santé avec le CHU d\'Angers</span> (premier employeur de la ville), la recherche publique (INRAE, Institut Agro) et le commerce de proximité complètent un marché du travail particulièrement équilibré.</li></ul><span style="font-weight: bold;color:#0063cb">Avec un taux de chômage inférieur à la moyenne nationale</span> et une politique publique très active en faveur de l\'apprentissage, Angers offre chaque année un volume important de contrats d\'alternance dans la plupart des secteurs.',
        activites: [],
      },
      mobilite: {
        text: "<span style=\"font-weight: bold;color:#0063cb\">Se déplacer à Angers est simple et économique</span> grâce au réseau Irigo qui couvre toute l'agglomération. Le réseau s'appuie sur <span style=\"font-weight: bold;color:#0063cb\">2 lignes de tramway (A et B)</span> qui relient les grands campus universitaires de Belle-Beille et Saint-Serge au centre-ville, à la gare et aux quartiers sud, avec des passages toutes les 6 à 10 minutes en heure de pointe. Une troisième ligne est en cours de déploiement pour renforcer le maillage. Plus de 30 lignes de bus complètent l'offre et desservent les zones d'activités périphériques comme l'Actipole d'Angers Est ou le parc d'activités de Beaucouzé.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">L'abonnement mensuel jeune (moins de 26 ans) coûte environ 22 euros</span>, l'un des tarifs les plus avantageux de France pour un alternant. La ville mise également fortement sur le vélo avec plus de <span style=\"font-weight: bold;color:#0063cb\">120 km d'aménagements cyclables</span> et le service de vélos en libre-service Vélocité, accessible à partir d'un abonnement très abordable.<br /><br />Le centre-ville, en partie piétonnier autour de la place du Ralliement et de la rue Saint-Laud, se parcourt facilement à pied. <span style=\"font-weight: bold;color:#0063cb\">La gare d'Angers Saint-Laud permet de rejoindre Paris en 1h30</span> grâce au TGV, ainsi que Nantes, Rennes ou Lyon, ce qui facilite les déplacements professionnels et les retours en famille le week-end.",
        transports: [
          { label: "Tramway (2 lignes)", type: "tramway" },
          { label: "Bus Irigo", type: "bus" },
          { label: "Vélocité", type: "velo" },
          { label: "Centre ville piétonnier", type: "pieton" },
          { label: "TGV Paris en 1h30", type: "tgv" },
          { label: "Trains régionaux", type: "train" },
        ],
      },
      logement: {
        text: `Trouver un logement à Angers reste très accessible pour les alternants, avec un marché beaucoup moins tendu que dans les grandes métropoles. <span style="font-weight: bold;color:#0063cb">Pour un studio, comptez entre 380 et 520 euros</span> charges comprises selon le quartier et l'état du bien, tandis qu'un T2 se situe généralement entre 500 et 700 euros.<ul><li>Les quartiers les plus prisés par les étudiants et alternants sont <span style="font-weight: bold;color:#0063cb">Saint-Serge et Ney-Chalouère</span>, proches du campus Saint-Serge, de la gare et du centre-ville, avec une ambiance jeune et de nombreux commerces.</li><li><span style="font-weight: bold;color:#0063cb">Belle-Beille</span>, à l'ouest, concentre le principal campus universitaire et propose des logements abordables avec de nombreuses résidences étudiantes.</li><li><span style="font-weight: bold;color:#0063cb">Le centre historique et la Doutre</span> attirent ceux qui recherchent du charme et de la vie nocturne, avec des loyers légèrement supérieurs, tandis que Monplaisir, La Roseraie et Les Justices offrent des loyers plus bas et un bon accès en tramway.</li></ul><span style="font-weight: bold;color:#0063cb">Les résidences du CROUS proposent des logements à partir de 250 euros</span>, mais les places sont limitées et la demande forte dès l'été. Des résidences étudiantes privées (Studéa, Nemea, Cardinal Campus) complètent l'offre avec des studios meublés et services inclus. ${MON_LOGEMENT_ETUDIANT_LINK} est un service public ayant pour objectif de faciliter l'accès au logement étudiant et référence plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches au moins deux mois avant la rentrée</span> sur les plateformes classiques (Leboncoin, PAP, SeLoger) et les groupes Facebook dédiés au logement étudiant à Angers. <span style="font-weight: bold;color:#0063cb">N'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer mensuel</span>, et pensez à la garantie Visale gratuite d'Action Logement si vous n'avez pas de garant. Certains employeurs proposent aussi une aide au logement dans le cadre du contrat d'alternance.`,
        loyers: [
          { type: "Studio", price_range: "380 - 520€" },
          { type: "T2", price_range: "500 - 700€" },
        ],
      },
      loisirs: {
        text: "Angers offre une vie culturelle et sportive particulièrement riche pour une ville de sa taille, qui saura séduire les alternants en quête d'équilibre entre travail et détente.<ul><li><span style=\"font-weight: bold;color:#0063cb\">Le château d'Angers et la tenture de l'Apocalypse</span>, plus grande tapisserie médiévale conservée au monde, donnent le ton d'un patrimoine exceptionnel complété par le musée des Beaux-Arts, la galerie David d'Angers et le musée Jean-Lurçat installé dans l'ancien hôpital Saint-Jean.</li><li><span style=\"font-weight: bold;color:#0063cb\">La place du Ralliement et la rue Saint-Laud</span> concentrent les bars, brasseries et restaurants où se retrouve la jeunesse angevine, avec une ambiance particulièrement animée le jeudi soir, jour traditionnel de sortie étudiante.</li><li><span style=\"font-weight: bold;color:#0063cb\">Les festivals rythment l'année</span> avec Premiers Plans (festival du jeune cinéma européen, l'un des plus importants d'Europe), Tempo Rives sur les bords de Maine l'été, les Accroche-Cœurs dans tout le centre-ville et Levitation France pour les musiques actuelles.</li><li>Côté scène musicale, <span style=\"font-weight: bold;color:#0063cb\">Le Chabada (SMAC), Le Quai (scène nationale) et l'Amphitea</span> programment des concerts et spectacles toute l'année à des tarifs accessibles, tandis que les cinémas Les 400 Coups et Pathé satisfont cinéphiles et grand public.</li><li><span style=\"font-weight: bold;color:#0063cb\">Les sportifs profitent du stade Raymond-Kopa</span> (SCO d'Angers en Ligue 1), d'un large réseau de clubs et salles municipales, du parc de Balzac, du parc Saint-Nicolas et de l'étang Saint-Nicolas pour courir ou se détendre. Les bords de Maine aménagés et la vallée de la Loire proche offrent de nombreuses possibilités de balades à pied ou à vélo.</li></ul>",
        types: [
          { label: "Château et musées", type: "musee" },
          { label: "Bords de Maine", type: "promenade" },
          { label: "Place du Ralliement", type: "bar" },
          { label: "Festivals", type: "musique" },
          { label: "Concerts et scène nationale", type: "concert" },
          { label: "Sport", type: "sport" },
        ],
      },
    },
  },
  {
    ville: "Brest",
    cp: "29200",
    slug: "brest",
    region: "Bretagne",
    geopoint: {
      lat: 48.390394,
      long: -4.486076,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "la métropole du Ponant",
        text: "Brest, sous-préfecture du Finistère et deuxième ville de Bretagne avec près de <strong>140 000 habitants</strong> (environ 210 000 dans la métropole Brest Métropole), est une ville portuaire ouverte sur l'océan Atlantique qui offre un cadre singulier aux alternants. Largement reconstruite après la Seconde Guerre mondiale, la ville présente un urbanisme des années 1950 caractéristique, avec de larges avenues et une rade exceptionnelle classée parmi les plus belles du monde. Brest bénéficie d'une économie structurée autour du secteur maritime, de la Défense et du numérique, portée par un écosystème de recherche de premier plan. Avec plus de <strong>25 000 étudiants</strong>, dont près de 23 000 à l'Université de Bretagne Occidentale (UBO), la ville propose une vie étudiante concentrée autour des campus de Bouguen et Segalen et un coût de la vie parmi les plus accessibles des métropoles françaises. Pour un alternant, Brest représente un compromis rare : des opportunités professionnelles solides dans des filières techniques pointues, un marché du logement abordable et une ambiance à taille humaine où les temps de trajet domicile-entreprise-école restent courts.",
        image: "brest.png",
      },
      vie: {
        text: 'Le tissu économique brestois est <span style="font-weight: bold;color:#0063cb">fortement spécialisé et porté par des filières d\'excellence</span>, offrant de nombreuses opportunités aux alternants. <ul><li><span style="font-weight: bold;color:#0063cb">Le secteur maritime et naval</span> est le premier employeur du bassin, avec Naval Group (plus de 2 500 salariés sur le site de Brest), les bases de la Marine nationale, Thales DMS, iXblue et un tissu dense de sous-traitants spécialisés en construction, maintenance et réparation navale.</li><li><span style="font-weight: bold;color:#0063cb">La recherche et les sciences de la mer</span> structurent le Technopôle Brest-Iroise à Plouzané avec l\'Ifremer, l\'IUEM, le Pôle Mer Bretagne Atlantique et plus de 1 500 chercheurs, qui recrutent en laboratoire, data et ingénierie.</li><li><span style="font-weight: bold;color:#0063cb">Le numérique, les télécoms et la cybersécurité</span> constituent une filière en pleine croissance autour d\'IMT Atlantique, Orange (centre R&amp;D), Capgemini, Sopra Steria et de nombreuses ETI et startups, notamment dans la French Tech Brest+.</li><li><span style="font-weight: bold;color:#0063cb">La banque-assurance et les services</span> sont bien représentés avec les sièges du Crédit Mutuel Arkéa et du groupe Arkéa qui recrutent massivement des alternants en informatique, data et relation client.</li><li>Le secteur de la santé avec le CHRU de Brest (premier employeur public du département), l\'agroalimentaire et la logistique portuaire complètent un panorama économique particulièrement complémentaire aux formations techniques, tertiaires et supérieures.</li></ul><span style="font-weight: bold;color:#0063cb">Avec un taux de chômage inférieur à la moyenne régionale</span> et une politique active d\'accueil des alternants portée par la métropole et la CCI Métropolitaine Bretagne Ouest, Brest offre un marché de l\'alternance moins tendu que dans les grandes métropoles, avec des entreprises souvent plus accessibles aux profils en formation.',
        activites: [],
      },
      mobilite: {
        text: '<span style="font-weight: bold;color:#0063cb">Se déplacer à Brest est simple et abordable</span> grâce au réseau Bibus qui dessert l\'ensemble de la métropole. Le réseau est structuré autour d\'<span style="font-weight: bold;color:#0063cb">une ligne de tramway</span> reliant Porte de Plouzané à Porte de Gouesnou via le centre-ville, et d\'un équipement unique en France, <span style="font-weight: bold;color:#0063cb">le téléphérique urbain</span> qui franchit la Penfeld et relie les deux rives en trois minutes, connecté aux autres modes de transport. Plus de 25 lignes de bus complètent le maillage, desservant les communes voisines comme Plouzané, Guipavas ou Le Relecq-Kerhuon.<br /><br /><span style="font-weight: bold;color:#0063cb">L\'abonnement mensuel jeune (-26 ans) coûte environ 30 euros</span>, un tarif parmi les plus avantageux des métropoles françaises, avec une prise en charge à 50% par l\'employeur dans le cadre de l\'alternance. La métropole poursuit le développement du vélo avec plus de <span style="font-weight: bold;color:#0063cb">100 km d\'aménagements cyclables</span> et un service de location longue durée Vélocibus à tarif étudiant.<br /><br /><span style="font-weight: bold;color:#0063cb">La gare SNCF de Brest</span> permet de rejoindre Rennes en 1h20 et Paris Montparnasse en environ 3h30 via la LGV Bretagne-Pays de la Loire, ce qui facilite les allers-retours famille ou les déplacements d\'école. La rocade brestoise et les axes RN12 et RN165 assurent les liaisons rapides vers Rennes, Quimper et Nantes pour les alternants ayant besoin de rejoindre des sites annexes en semaine.',
        transports: [
          { label: "Tramway", type: "tramway" },
          { label: "Téléphérique urbain", type: "funiculaire" },
          { label: "Bus Bibus", type: "bus" },
          { label: "Vélocibus", type: "velo" },
          { label: "100 km de pistes cyclables", type: "trottinette" },
          { label: "Gare SNCF", type: "tgv" },
        ],
      },
      logement: {
        text: `Trouver un logement à Brest <span style="font-weight: bold;color:#0063cb">reste très accessible pour les alternants</span>, avec des loyers parmi les plus abordables des métropoles françaises. Pour un studio, comptez entre 350 et 500 euros charges comprises selon le quartier et l'état du bien, tandis qu'un T2 se situe généralement entre 450 et 650 euros.<ul><li>Les quartiers les plus prisés par les étudiants et alternants sont <span style="font-weight: bold;color:#0063cb">Saint-Martin et Kérinou</span>, proches du centre et des campus de Bouguen et Segalen, avec une offre importante de petits logements et une ambiance jeune.</li><li><span style="font-weight: bold;color:#0063cb">Le centre-ville (Siam, Jean-Jaurès, Liberté)</span> attire ceux qui veulent vivre à proximité immédiate des commerces, des lignes de tram et de la vie nocturne étudiante, avec des loyers légèrement plus élevés.</li><li><span style="font-weight: bold;color:#0063cb">Recouvrance et Saint-Pierre</span>, sur la rive droite de la Penfeld, proposent les loyers les plus accessibles et sont désormais bien reliés au centre grâce au téléphérique et au tram.</li><li><span style="font-weight: bold;color:#0063cb">Lambézellec et Bellevue</span> offrent un cadre plus résidentiel et restent appréciés des alternants travaillant au Technopôle Brest-Iroise à Plouzané.</li></ul><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches au moins deux mois avant la rentrée</span> sur les plateformes classiques (Leboncoin, PAP, SeLoger) ainsi que via les groupes Facebook dédiés au logement étudiant brestois. Les résidences CROUS proposent des logements entre 250 et 400 euros, très demandés en début d'année universitaire. ${MON_LOGEMENT_ETUDIANT_LINK} est un service public ayant pour objectif de faciliter l'accès au logement étudiant et référence plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style="font-weight: bold;color:#0063cb">N'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer mensuel</span>, et que la garantie Visale d'Action Logement (gratuite pour les moins de 30 ans) peut remplacer un garant physique. Certains employeurs proposent également une aide au logement dans le cadre du contrat d'alternance, pensez à vous renseigner.`,
        loyers: [
          { type: "Studio", price_range: "350 - 500€" },
          { type: "T2", price_range: "450 - 650€" },
        ],
      },
      loisirs: {
        text: 'Brest offre une <span style="font-weight: bold;color:#0063cb">vie culturelle et associative particulièrement dense</span> pour une ville de sa taille, avec de nombreux équipements accessibles aux alternants.<ul><li><span style="font-weight: bold;color:#0063cb">Les bords de la rade et le port du Moulin-Blanc</span> constituent un terrain de promenade et de sport privilégié, avec la voie verte qui relie le centre-ville au port de commerce et Océanopolis, l\'un des plus grands centres de culture scientifique maritime d\'Europe.</li><li><span style="font-weight: bold;color:#0063cb">La vie nocturne étudiante</span> se concentre autour de la rue Jean-Jaurès, de la place Guérin et de la rue de Siam, avec de nombreux bars étudiants à budget accessible et des soirées jeudi soir emblématiques fréquentées par l\'UBO, IMT Atlantique et les écoles de commerce.</li><li><span style="font-weight: bold;color:#0063cb">La scène culturelle</span> est portée par La Carène (scène de musiques actuelles labellisée SMAC), Le Quartz (scène nationale), l\'Arena Brest et de nombreuses associations qui programment tout au long de l\'année. Le festival Astropolis en été et les Jeudis du Port en juillet-août rythment la vie culturelle.</li><li><span style="font-weight: bold;color:#0063cb">Les musées gratuits pour les moins de 26 ans</span> (musée des Beaux-Arts, musée national de la Marine installé dans le Château) et le cinéma d\'art et essai Les Studios enrichissent l\'offre culturelle à petit prix.</li><li><span style="font-weight: bold;color:#0063cb">Le sport et la nature</span> occupent une place centrale avec de nombreuses infrastructures municipales, les clubs du Brest Bretagne Handball et du Stade Brestois, et la proximité des sentiers côtiers du GR34 et des pointes du Finistère pour randonner le week-end.</li><li><span style="font-weight: bold;color:#0063cb">Les activités nautiques</span> (voile, kayak, aviron) sont accessibles via de nombreux clubs associatifs qui proposent des tarifs étudiants dans la rade, l\'un des plus beaux plans d\'eau naturels d\'Europe.</li></ul>',
        types: [
          { label: "Bords de rade", type: "quai" },
          { label: "Musées et patrimoine", type: "musee" },
          { label: "Vie nocturne étudiante", type: "bar" },
          { label: "Concerts et théâtre", type: "concert" },
          { label: "Sport et nature", type: "sport" },
          { label: "Activités nautiques", type: "boat" },
        ],
      },
    },
  },
  {
    ville: "Orléans",
    cp: "45000",
    slug: "orleans",
    region: "Centre-Val de Loire",
    geopoint: {
      lat: 47.902964,
      long: 1.909251,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "préfecture du Loiret",
        text: "Orléans, préfecture du Loiret et capitale de la région Centre-Val de Loire, compte près de <strong>117 000 habitants</strong> et plus de <strong>290 000 habitants</strong> dans sa métropole (Orléans Métropole). Située à seulement <strong>1h de Paris en train</strong> via les lignes Intercités vers Paris-Austerlitz, Orléans bénéficie d'une position stratégique au cœur du Bassin parisien, au bord de la Loire et à la porte des châteaux de la Loire. La ville a connu une transformation urbaine importante ces vingt dernières années avec la rénovation de son centre historique, la piétonisation de la rue de Bourgogne et l'arrivée de deux lignes de tramway. Avec ses rues médiévales, sa cathédrale Sainte-Croix et son patrimoine lié à Jeanne d'Arc, Orléans offre un cadre urbain à taille humaine où il fait bon étudier et travailler. La ville accueille plus de <strong>25 000 étudiants</strong>, dont une large part sur le campus de La Source qui regroupe l'Université d'Orléans, le CNRS et le BRGM. Pour un alternant, Orléans représente un excellent compromis : un tissu économique dense porté par la logistique, la cosmétique et la pharmacie, un coût de la vie bien plus abordable que l'Île-de-France, et une vraie proximité avec Paris pour les retours en famille ou les entretiens.",
        image: "orleans.png",
      },
      vie: {
        text: `Le tissu économique orléanais est <span style="font-weight: bold;color:#0063cb">dense et diversifié</span>, porté par la position logistique stratégique de la ville au cœur du Bassin parisien et par plusieurs filières industrielles d'excellence. <ul><li><span style="font-weight: bold;color:#0063cb">La logistique et la supply chain</span> constituent le premier pilier économique de la métropole : la plateforme logistique d'Orléans-Saran figure parmi les plus grandes de France, avec des acteurs comme Amazon, IKEA, Dior, John Deere ou Scapartois qui recrutent massivement des alternants en gestion d'entrepôt, approvisionnement, transport et data.</li><li><span style="font-weight: bold;color:#0063cb">La cosmétique et la parfumerie</span> font d'Orléans le cœur de la Cosmetic Valley, premier pôle mondial du secteur, avec les sites de LVMH Parfums Christian Dior (Saint-Jean-de-Braye), Shiseido, Gemey Maybelline (L'Oréal) ou Caudalie, qui proposent de nombreux contrats en production, qualité, R&D, marketing et commerce international.</li><li><span style="font-weight: bold;color:#0063cb">L'industrie pharmaceutique</span> est également très présente avec les laboratoires Servier à Gidy, Famar, Pfizer Santé Familiale et Baxter, qui forment une filière biotech et pharma structurée.</li><li>Le <span style="font-weight: bold;color:#0063cb">secteur bancaire et assurantiel</span> est porté par Groupama dont le siège régional est à Orléans, ainsi que par le Crédit Agricole Centre Loire, la MAIF ou AG2R La Mondiale.</li><li>Enfin, la <span style="font-weight: bold;color:#0063cb">recherche et les services publics</span> s'appuient sur le CNRS, le BRGM, l'INRAE et le CHR d'Orléans, premier employeur de la métropole avec plus de 5 500 salariés.</li></ul>Avec un bassin d'emploi dynamique, un taux de chômage inférieur à la moyenne nationale et une politique régionale active en faveur de l'apprentissage, Orléans propose chaque année plusieurs milliers de contrats d'alternance accessibles à tous les niveaux de formation.`,
        activites: [],
      },
      mobilite: {
        text: `Se déplacer à Orléans et dans la métropole est <span style="font-weight: bold;color:#0063cb">simple et bien organisé</span> grâce au réseau TAO (Transports de l'Agglomération Orléanaise), qui couvre l'ensemble des 22 communes d'Orléans Métropole. Le réseau s'articule autour de <span style="font-weight: bold;color:#0063cb">2 lignes de tramway (A et B)</span> qui forment une croix au centre-ville et desservent notamment le campus universitaire de La Source, la gare d'Orléans et la gare d'Orléans-Les Aubrais, complétées par une trentaine de lignes de bus urbains et suburbains.<br /><br />L'abonnement mensuel TAO pour les moins de 26 ans coûte environ <span style="font-weight: bold;color:#0063cb">30€ par mois</span>, et votre entreprise d'accueil prend en charge 50% de cet abonnement, ce qui ramène le coût réel à environ 15€. Orléans est également <span style="font-weight: bold;color:#0063cb">une ville très cyclable</span> grâce à son relief plat et à plus de 400 km d'aménagements cyclables dans la métropole, complétés par le service Vélo+ qui propose 330 vélos en libre-service dans 34 stations, accessible dès 30€ par an.<br /><br />Pour les liaisons longue distance, Orléans dispose de <span style="font-weight: bold;color:#0063cb">deux gares ferroviaires majeures</span> : la gare d'Orléans au centre-ville et la gare d'Orléans-Les Aubrais (au nord), desservies par les Intercités et TER qui permettent de rejoindre Paris-Austerlitz en 1h, Tours en 45 min, Blois en 30 min et Bourges en 1h. La ville est aussi idéalement placée sur l'A10 et l'A71, avec Paris à 1h15 en voiture, ce qui simplifie les trajets pour les alternants basés en Île-de-France.`,
        transports: [
          { label: "Tramway TAO (lignes A et B)", type: "tramway" },
          { label: "Bus TAO", type: "bus" },
          { label: "Vélo+", type: "velo" },
          { label: "Pistes cyclables", type: "trottinette" },
          { label: "Intercités et TER", type: "tgv" },
          { label: "Gares d'Orléans et des Aubrais", type: "train" },
        ],
      },
      logement: {
        text: `Le marché du logement à Orléans est <span style="font-weight: bold;color:#0063cb">accessible et nettement moins tendu qu'en Île-de-France</span>, ce qui en fait l'un des atouts majeurs de la ville pour les alternants. Pour un studio de 20 à 25m², il faut compter entre 380 et 550€ charges comprises selon le quartier, et entre 500 et 750€ pour un T2 de 35 à 45m².<ul><li>Le <span style="font-weight: bold;color:#0063cb">centre-ville historique</span>, autour de la rue de Bourgogne, de la place du Martroi et de la cathédrale, séduit par son charme médiéval, ses rues piétonnes et sa vie étudiante, mais affiche les loyers les plus élevés.</li><li><span style="font-weight: bold;color:#0063cb">Saint-Marceau et Dunois</span>, au sud de la Loire, offrent un bon compromis entre calme résidentiel et accès rapide au centre par le tramway, avec des loyers 10 à 15% plus abordables.</li><li>Le quartier de <span style="font-weight: bold;color:#0063cb">La Source</span>, qui regroupe le campus universitaire, le CNRS et le BRGM, est idéal pour les alternants en formation à l'Université d'Orléans : loyers très abordables et tramway direct vers le centre en 20 minutes.</li><li>Pour un budget plus serré, <span style="font-weight: bold;color:#0063cb">Fleury-les-Aubrais, Saint-Jean-de-la-Ruelle ou Olivet</span> (bien reliées par bus et tram) proposent des logements jusqu'à 20% moins chers tout en restant à moins de 20 minutes du centre.</li></ul>Les résidences CROUS et les résidences étudiantes privées (Studéa, Nexity Studéa, Les Estudines) proposent des studios meublés entre 400 et 620€ par mois, souvent plus chers mais avec services inclus. Rendez-vous sur ${MON_LOGEMENT_ETUDIANT_LINK}, un service public ayant pour objectif de faciliter l'accès au logement étudiant pour découvrir plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France.<br /><br /><span style="font-weight: bold;color:#0063cb">N'oubliez pas de demander l'APL</span> qui peut réduire votre loyer de 100 à 200€ par mois, et pensez à commencer vos recherches au moins 2 mois avant la rentrée sur Leboncoin, PAP ou les groupes Facebook dédiés. La demande reste raisonnable toute l'année, mais préparez un dossier complet avec garants (physique ou Visale) pour sécuriser votre location.`,
        loyers: [
          { type: "Studio", price_range: "380 - 550€" },
          { type: "T2", price_range: "500 - 750€" },
        ],
      },
      loisirs: {
        text: `Orléans offre une vie culturelle et étudiante <span style="font-weight: bold;color:#0063cb">bien plus dense qu'on ne l'imagine</span>, portée par ses 25 000 étudiants et un patrimoine historique remarquable.<ul><li><span style="font-weight: bold;color:#0063cb">La vie nocturne étudiante</span> se concentre autour de la rue de Bourgogne, artère piétonne emblématique qui rassemble une centaine de bars, cafés, restaurants et petites salles de concert à prix abordables, particulièrement animée du jeudi au samedi.</li><li>Côté culture, la ville abrite <span style="font-weight: bold;color:#0063cb">le musée des Beaux-Arts d'Orléans</span>, l'un des plus riches de France en régions avec ses collections du XVIe au XXe siècle, ainsi que le FRAC Centre-Val de Loire dédié à l'architecture contemporaine et la Maison de Jeanne d'Arc.</li><li><span style="font-weight: bold;color:#0063cb">La scène musicale</span> est portée par le Zénith d'Orléans, la scène de musiques actuelles L'Astrolabe (SMAC) et le 108 (centre culturel municipal), qui proposent une programmation variée à tarifs étudiants.</li><li>Les amateurs de balades profitent des <span style="font-weight: bold;color:#0063cb">bords de Loire</span> entièrement réaménagés en quais piétons avec espaces verts et terrasses, du parc Pasteur et du parc floral de la Source, avec plus de 35 hectares de jardins.</li><li>Côté sport, <span style="font-weight: bold;color:#0063cb">l'Orléans Loiret Basket</span> et l'USO Foot font vibrer la ville, et la métropole propose de nombreux équipements sportifs municipaux à tarifs étudiants (piscines, gymnases, terrains).</li><li>Enfin, Orléans accueille chaque année <span style="font-weight: bold;color:#0063cb">les Fêtes de Jeanne d'Arc</span> fin avril / début mai et le Festival de Loire tous les deux ans, plus grand rassemblement de marine fluviale d'Europe, deux événements emblématiques de la vie locale.</li></ul>`,
        types: [
          { label: "Vie nocturne étudiante", type: "bar" },
          { label: "Musées et expositions", type: "musee" },
          { label: "Concerts et festivals", type: "concert" },
          { label: "Bords de Loire", type: "quai" },
          { label: "Parcs et promenades", type: "promenade" },
          { label: "Sport", type: "sport" },
        ],
      },
    },
  },
  {
    ville: "Limoges",
    cp: "87000",
    slug: "limoges",
    region: "Nouvelle-Aquitaine",
    geopoint: {
      lat: 45.833619,
      long: 1.261105,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "préfecture de la Haute-Vienne",
        text: "Limoges, préfecture de la Haute-Vienne et ancienne capitale de la région Limousin, compte environ <strong>130 000 habitants</strong> (près de 280 000 dans la communauté urbaine Limoges Métropole). Réputée pour son savoir-faire industriel historique autour de la porcelaine, de l'émail et du cuir, la ville a su diversifier son tissu économique pour devenir aujourd'hui un pôle équilibré où l'industrie, la santé et les services aux entreprises coexistent. Pour un alternant, Limoges présente une équation très favorable : un coût de la vie parmi les plus bas des préfectures françaises, un marché locatif détendu, des temps de trajet domicile-entreprise courts et une université qui accueille près de <strong>16 000 étudiants</strong>. La ville est également bien connectée, avec une liaison directe vers Paris en 3h par le train et un accès rapide à Poitiers, Brive et Clermont-Ferrand. Son centre-ville médiéval (quartier de la Boucherie, cité épiscopale) et ses nombreux espaces verts en font un cadre de travail et de formation apprécié des jeunes en alternance qui cherchent à se concentrer sur leur insertion professionnelle sans subir la pression des grandes métropoles.",
        image: "limoges.png",
      },
      vie: {
        text: 'Le tissu économique limougeaud est <span style="font-weight: bold;color:#0063cb">porté par plusieurs filières historiques et par un secteur tertiaire en croissance</span>, avec un taux de chômage qui se maintient proche de la moyenne nationale. <ul><li><span style="font-weight: bold;color:#0063cb">La filière céramique et arts de la table</span> reste un marqueur fort du territoire, avec des maisons comme Bernardaud, Haviland ou la Manufacture Royale de Limoges qui recrutent des alternants sur des métiers de production, design, commerce et marketing.</li><li><span style="font-weight: bold;color:#0063cb">L\'industrie et la maroquinerie de luxe</span> sont très présentes avec Weston à Limoges et la sous-traitance Hermès/LVMH dans la région, offrant des contrats en logistique, qualité, maintenance et supply chain.</li><li><span style="font-weight: bold;color:#0063cb">Le secteur de la santé</span> constitue un des premiers employeurs avec le CHU Dupuytren, la clinique Chénieux et plusieurs laboratoires, ce qui tire la demande en alternance sur les fonctions support (RH, gestion, numérique).</li><li><span style="font-weight: bold;color:#0063cb">Le numérique et les services aux entreprises</span> se développent autour d\'Ester Technopole et du pôle Legrand (équipements électriques), avec des ESN locales et nationales qui recrutent régulièrement des alternants en développement, data et cybersécurité.</li><li>La banque, l\'assurance et la grande distribution sont également des pourvoyeurs réguliers d\'alternance, notamment Crédit Agricole Centre Ouest, Groupama et les enseignes implantées sur la zone Family Village ou dans le centre commercial Saint-Martial.</li></ul><span style="font-weight: bold;color:#0063cb">La taille humaine du bassin d\'emploi</span> permet aux alternants d\'accéder plus facilement à des postes à responsabilité et de tisser rapidement un réseau professionnel solide.',
        activites: [],
      },
      mobilite: {
        text: "Le réseau de transports en commun <span style=\"font-weight: bold;color:#0063cb\">STCL (Société des Transports en Commun de Limoges)</span> couvre l'ensemble de l'agglomération avec deux lignes de trolleybus (2 et 4) qui constituent la colonne vertébrale du réseau, complétées par une vingtaine de lignes de bus desservant les principaux pôles d'études et zones d'activités.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">L'abonnement mensuel jeunes (moins de 26 ans) coûte environ 23 euros</span>, l'un des tarifs les plus bas de France, et les employeurs remboursent 50% de ce montant dans le cadre de l'alternance. Un pass annuel est également proposé autour de 200 euros.<br /><br />La ville est très compacte, ce qui rend les déplacements à pied et à vélo particulièrement efficaces. Le service de vélos en libre-service <span style=\"font-weight: bold;color:#0063cb\">V'Lim propose une flotte d'environ 180 vélos</span>, et le réseau de pistes cyclables s'étend progressivement (environ 80 km aménagés à ce jour).<br /><br />Pour les trajets longue distance, <span style=\"font-weight: bold;color:#0063cb\">la gare de Limoges-Bénédictins, classée monument historique, permet de rejoindre Paris en 3h par les Intercités</span>, Toulouse en 3h30 et Bordeaux en 2h15. La ligne TER Limoges-Poitiers et Limoges-Brive-Clermont permet de rejoindre les bassins d'emploi voisins. Pour les alternants qui possèdent une voiture, l'A20 (gratuite) offre un accès direct à Paris et Toulouse, et le stationnement reste abordable par rapport aux grandes métropoles.",
        transports: [
          { label: "Trolleybus STCL", type: "bus" },
          { label: "Bus (20 lignes)", type: "bus" },
          { label: "V'Lim", type: "velo" },
          { label: "Centre-ville piéton", type: "pieton" },
          { label: "Gare Limoges-Bénédictins", type: "tgv" },
          { label: "Réseau TER", type: "train" },
        ],
      },
      logement: {
        text: `<span style="font-weight: bold;color:#0063cb">Le marché locatif limougeaud est l'un des plus accessibles de France</span>, un vrai atout pour un alternant qui démarre dans la vie active.<br /><br />Pour un studio, comptez entre <span style="font-weight: bold;color:#0063cb">300€ et 450€</span> charges comprises selon le quartier et l'état du bien, tandis qu'un T2 se situe généralement entre <span style="font-weight: bold;color:#0063cb">400€ et 600€</span>.<ul><li><span style="font-weight: bold;color:#0063cb">Le centre-ville et le quartier de la Boucherie</span> sont prisés pour leur proximité avec les commerces, les halles centrales et les principaux lieux de formation, avec un bon rapport qualité-prix.</li><li><span style="font-weight: bold;color:#0063cb">Le quartier Carnot-Marceau et les abords de la gare</span> offrent des logements bien desservis en trolleybus, à quelques minutes à pied de la gare Limoges-Bénédictins.</li><li><span style="font-weight: bold;color:#0063cb">Le quartier de La Borie et Landouge</span>, plus résidentiels, proposent des loyers légèrement inférieurs et sont proches du campus universitaire.</li><li><span style="font-weight: bold;color:#0063cb">Beaune-les-Mines et Le Vigenal</span> constituent des alternatives abordables pour ceux qui travaillent dans les zones d'activités nord et est de l'agglomération.</li></ul>Les résidences CROUS (Marcel-Vardelle, La Borie, Saint-Martial) proposent des logements à partir de 200€ par mois, mais les places restent limitées. Les résidences étudiantes privées (Studéa, Néméa) offrent des studios meublés à partir de 400€. <span style="font-weight: bold;color:#0063cb">Les APL peuvent couvrir une partie significative du loyer</span>, et la garantie Visale proposée par Action Logement est gratuite pour les alternants de moins de 30 ans. Consultez ${MON_LOGEMENT_ETUDIANT_LINK}, un service public ayant pour objectif de faciliter l'accès au logement étudiant qui référence plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. Commencez vos recherches 1 à 2 mois avant la rentrée pour disposer d'un large choix.`,
        loyers: [
          { type: "Studio", price_range: "300 - 450€" },
          { type: "T2", price_range: "400 - 600€" },
        ],
      },
      loisirs: {
        text: 'Limoges offre une <span style="font-weight: bold;color:#0063cb">vie étudiante conviviale à taille humaine</span>, avec une scène culturelle régulière et de nombreux espaces verts pour décompresser entre deux périodes en entreprise.<ul><li><span style="font-weight: bold;color:#0063cb">Le quartier de la Boucherie et la place de la Motte</span> concentrent la majorité des bars et restaurants étudiants, avec des soirées animées le jeudi soir autour des halles centrales.</li><li><span style="font-weight: bold;color:#0063cb">Le Zénith de Limoges, le CCM Jean Gagnant et l\'Opéra</span> accueillent concerts, spectacles et pièces de théâtre tout au long de l\'année, avec des tarifs préférentiels pour les moins de 26 ans.</li><li><span style="font-weight: bold;color:#0063cb">Le musée national Adrien Dubouché</span> (porcelaine) et le musée des Beaux-Arts sont gratuits pour les étudiants et donnent une vraie profondeur au patrimoine local.</li><li><span style="font-weight: bold;color:#0063cb">Les festivals rythment l\'année</span> : Éclats d\'Émail (jazz), les Francophonies (théâtre et musiques du monde) en automne, et le Festival Urbaka (arts de la rue) en été.</li><li><span style="font-weight: bold;color:#0063cb">Les parcs urbains</span> (jardins de l\'Évêché, parc Victor-Thuillat, bords de Vienne) et le lac d\'Uzurat au nord de la ville offrent des espaces de promenade, de course à pied et de détente très accessibles.</li><li><span style="font-weight: bold;color:#0063cb">Les infrastructures sportives municipales</span> (piscines, salles de sport, stade de Beaublanc où évolue le CSP Limoges en basket) sont nombreuses et affichent des tarifs étudiants très compétitifs.</li></ul>La proximité du lac de Saint-Pardoux, à 30 minutes, et du Parc naturel régional Périgord-Limousin permet par ailleurs des sorties nature en week-end pour ceux qui cherchent à souffler.',
        types: [
          { label: "Bars et restaurants", type: "bar" },
          { label: "Concerts et théâtres", type: "concert" },
          { label: "Musées", type: "musee" },
          { label: "Festivals", type: "musique" },
          { label: "Parcs et bords de Vienne", type: "promenade" },
          { label: "Sport", type: "sport" },
        ],
      },
    },
  },
  {
    ville: "Caen",
    cp: "14000",
    slug: "caen",
    region: "Normandie",
    geopoint: {
      lat: 49.182863,
      long: -0.370679,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "cité de Guillaume le Conquérant",
        text: "Caen, préfecture du Calvados avec près de <strong>106 000 habitants</strong> (270 000 dans la communauté urbaine Caen la Mer), est une ville à taille humaine qui offre un cadre de travail et d'études particulièrement adapté aux alternants. Marquée par son histoire millénaire — des abbayes romanes fondées par Guillaume le Conquérant à la reconstruction d'après-guerre — la ville combine patrimoine médiéval et urbanisme moderne au cœur d'un centre compact et largement piéton. Avec plus de <strong>33 000 étudiants</strong> concentrés autour de l'Université de Caen Normandie et de ses grandes écoles (EM Normandie, ENSICaen), la cité ducale dispose d'une vie étudiante animée et d'un marché locatif bien plus accessible que dans les grandes métropoles. Pour un alternant, Caen représente l'équilibre entre un bassin d'emploi diversifié (numérique, santé, assurance, recherche), un coût de la vie maîtrisé et une localisation stratégique à 2h de Paris en train. L'ambiance y est calme et conviviale, avec une densité étudiante qui dynamise les quartiers du centre et facilite l'intégration pour les nouveaux arrivants.",
        image: "caen.png",
      },
      vie: {
        text: `Caen dispose d'un tissu économique <span style="font-weight: bold;color:#0063cb">diversifié et orienté vers les secteurs d'avenir</span>, avec de nombreuses opportunités d'alternance pour les profils en formation supérieure.<ul><li><span style="font-weight: bold;color:#0063cb">Le numérique</span> est particulièrement dynamique avec la présence de NXP Semiconductors, Orange Labs, Thales, Dassault Systèmes et un écosystème de PME regroupées au sein du pôle TES (Transactions Électroniques Sécurisées) et de la French Tech Normandie.</li><li><span style="font-weight: bold;color:#0063cb">L'assurance et la banque</span> pèsent lourd localement grâce au groupe Covéa (MMA, MAAF, GMF) dont le siège historique est implanté au Mans mais dont Caen accueille de nombreux services et back-offices.</li><li><span style="font-weight: bold;color:#0063cb">La santé et la recherche médicale</span> représentent un bassin d'emploi majeur avec le CHU de Caen, le Centre François Baclesse (lutte contre le cancer) et le GANIL (Grand Accélérateur National d'Ions Lourds), pôle de recherche nucléaire de renommée mondiale.</li><li><span style="font-weight: bold;color:#0063cb">L'agroalimentaire</span> reste un pilier régional avec des industriels comme Danone-Nutricia, Lactalis ou Agrial qui recrutent régulièrement des alternants en production, qualité, supply chain et commerce.</li><li>Le BTP, les services aux collectivités et la logistique portuaire (liaison ferry Ouistreham-Portsmouth) complètent ce panorama.</li></ul>Avec un <span style="font-weight: bold;color:#0063cb">taux de chômage proche de la moyenne nationale</span> et une volonté affichée de la région Normandie d'accueillir davantage d'alternants, Caen offre un marché accessible où les candidatures sont examinées avec attention par des entreprises de taille humaine.`,
        activites: [],
      },
      mobilite: {
        text: `<span style="font-weight: bold;color:#0063cb">Se déplacer à Caen est simple et peu coûteux</span> grâce au réseau Twisto, géré par Caen la Mer Mobilités, qui dessert l'ensemble de l'agglomération.<br /><br />Le réseau comprend <span style="font-weight: bold;color:#0063cb">3 lignes de tramway modernes</span> (T1, T2, T3) mises en service en 2019 et qui relient les principaux campus universitaires, le centre-ville et les grands quartiers résidentiels, complétées par une <span style="font-weight: bold;color:#0063cb">vingtaine de lignes de bus</span> avec une fréquence élevée en heures de pointe.<br /><br /><span style="font-weight: bold;color:#0063cb">L'abonnement mensuel jeune (moins de 26 ans) coûte environ 26 euros</span>, l'un des tarifs les plus avantageux parmi les agglomérations françaises comparables. Caen est également <span style="font-weight: bold;color:#0063cb">une ville très cyclable</span> grâce à son relief plat et à plus de 150 km d'aménagements cyclables. Le service de vélos en libre-service V'eol propose un abonnement <span style="font-weight: bold;color:#0063cb">à partir de 25 euros par an</span> pour les étudiants, imbattable pour les trajets quotidiens.<br /><br />Le centre historique étant largement piéton, beaucoup d'alternants se déplacent à pied pour leurs trajets courts. Pour rejoindre Paris, <span style="font-weight: bold;color:#0063cb">la gare SNCF de Caen permet de rejoindre Paris Saint-Lazare en 2h</span> avec une quinzaine d'allers-retours quotidiens, pratique pour rentrer le week-end ou se rendre à un entretien. Les liaisons régionales desservent également Rouen, Le Havre et Cherbourg.`,
        transports: [
          { label: "3 lignes de tramway", type: "tramway" },
          { label: "Bus", type: "bus" },
          { label: "V'eol", type: "velo" },
          { label: "Pistes cyclables", type: "velo" },
          { label: "Centre piéton", type: "pieton" },
          { label: "Gare SNCF", type: "tgv" },
        ],
      },
      logement: {
        text: `Trouver un logement à Caen est <span style="font-weight: bold;color:#0063cb">l'un des atouts majeurs de la ville</span> : le marché reste fluide et les loyers très accessibles par rapport aux autres métropoles régionales. Pour un studio, comptez entre <span style="font-weight: bold;color:#0063cb">350 et 500 euros</span> charges comprises selon le quartier et l'état du bien ; un T2 se situe généralement entre <span style="font-weight: bold;color:#0063cb">500 et 700 euros</span>.<ul><li><span style="font-weight: bold;color:#0063cb">Le centre-ville (Saint-Pierre, Saint-Jean, Vaugueux)</span> reste le plus demandé par les étudiants et alternants, avec une vie de quartier animée et tous les services à pied.</li><li><span style="font-weight: bold;color:#0063cb">Le quartier Université / Côte de Nacre</span>, à proximité immédiate du campus principal et du CHU, offre un excellent rapport qualité-prix et est très bien desservi par le tramway.</li><li><span style="font-weight: bold;color:#0063cb">Les quartiers de la Guérinière, du Chemin Vert et de la Folie-Couvrechef</span> permettent de trouver des T2 à moins de 600 euros, avec un accès tramway direct au centre.</li></ul>Les résidences CROUS proposent des chambres et studios à partir de 250 euros, particulièrement adaptés aux budgets serrés mais avec une forte demande à l'approche de la rentrée. Côté résidences privées, des acteurs comme Studéa ou Nexity proposent des logements meublés tout équipés à partir de 500 euros. Rendez-vous sur ${MON_LOGEMENT_ETUDIANT_LINK}, un service public ayant pour objectif de faciliter l'accès au logement étudiant pour découvrir plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches dès mai-juin pour une rentrée en septembre</span>. N'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer, et que certaines entreprises d'accueil proposent une aide au logement dans le cadre du contrat d'alternance. La faible tension locative permet généralement de constituer un dossier sans stress, même sans garant fortuné.`,
        loyers: [
          { type: "Studio", price_range: "350 - 500€" },
          { type: "T2", price_range: "500 - 700€" },
        ],
      },
      loisirs: {
        text: `Caen offre une vie culturelle et sportive dense qui séduira les alternants en quête d'équilibre entre travail et temps libre, avec l'avantage d'une offre concentrée et accessible à pied ou en tramway.<ul><li><span style="font-weight: bold;color:#0063cb">Le Mémorial de Caen</span>, l'un des musées d'histoire les plus fréquentés de France, propose régulièrement des tarifs réduits et des événements pour les moins de 26 ans, aux côtés du Musée des Beaux-Arts installé dans l'enceinte du château ducal.</li><li><span style="font-weight: bold;color:#0063cb">La scène musicale locale est portée par Le Cargö</span>, scène de musiques actuelles reconnue (SMAC), et par le Zénith de Caen qui accueille concerts et spectacles d'envergure nationale tout au long de l'année.</li><li><span style="font-weight: bold;color:#0063cb">Les quartiers du Vaugueux et de Saint-Pierre</span> concentrent l'essentiel de la vie nocturne étudiante avec de nombreux bars et restaurants à prix accessibles, particulièrement animés les soirées du jeudi.</li><li><span style="font-weight: bold;color:#0063cb">Le château ducal et l'Abbaye aux Hommes</span> offrent un décor unique en plein centre-ville, avec des expositions temporaires et des parcours patrimoniaux gratuits pour les étudiants.</li><li><span style="font-weight: bold;color:#0063cb">Côté sport</span>, la ville dispose de nombreuses infrastructures municipales (piscines, salles, stade Michel-d'Ornano du Stade Malherbe), de clubs associatifs accessibles et de plus de 20 km de voies vertes aménagées le long du canal et de l'Orne.</li><li>Pour se changer les idées le week-end, <span style="font-weight: bold;color:#0063cb">la côte de Nacre est accessible en 20 minutes en train</span> pour marcher ou courir le long du littoral.</li></ul>`,
        types: [
          { label: "Musées", type: "musee" },
          { label: "Concerts et théâtre", type: "concert" },
          { label: "Bars étudiants", type: "bar" },
          { label: "Patrimoine", type: "promenade" },
          { label: "Sport", type: "sport" },
          { label: "Voies vertes", type: "quai" },
        ],
      },
    },
  },
  {
    ville: "Le Mans",
    cp: "72000",
    slug: "le-mans",
    region: "Pays de la Loire",
    geopoint: {
      lat: 48.00611,
      long: 0.199556,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "cité Plantagenêt",
        text: "Le Mans, préfecture de la Sarthe, est une ville de près de 145 000 habitants, au cœur d'une métropole qui en compte environ 210 000. À seulement 55 minutes de Paris en TGV, elle combine un ancrage industriel fort et une qualité de vie reconnue, avec un coût de la vie nettement inférieur à celui des grandes métropoles. Son centre historique, la Cité Plantagenêt, est l'un des plus vastes ensembles médiévaux et Renaissance de France, entouré par une exceptionnelle enceinte romaine du IIIe siècle. Avec plus de <strong>13 000 étudiants</strong> répartis entre Le Mans Université, des écoles d'ingénieurs (ENSIM, ISMANS) et de nombreux établissements de formation, la ville offre un écosystème favorable à l'alternance. Pour un jeune en formation, Le Mans présente un équilibre rare : des recruteurs de premier plan dans l'assurance, l'automobile et l'agroalimentaire, un marché du logement accessible et une position centrale entre Paris, la Bretagne, la Normandie et les Pays de la Loire. L'ambiance y est conviviale, à taille humaine, avec un tissu associatif et culturel dense.",
        image: "le-mans.png",
      },
      vie: {
        text: "Le tissu économique manceau est <span style=\"font-weight: bold;color:#0063cb\">historiquement industriel et fortement tertiarisé</span>, offrant un large éventail d'opportunités d'alternance.<ul><li><span style=\"font-weight: bold;color:#0063cb\">L'assurance est le poumon économique de la ville</span> avec le siège de Covéa (MMA, MAAF, GMF) qui emploie plusieurs milliers de personnes et recrute chaque année de nombreux alternants dans la gestion de contrats, l'actuariat, l'informatique, la relation client et la data.</li><li><span style=\"font-weight: bold;color:#0063cb\">L'industrie automobile et mécanique</span> structure l'emploi local avec des équipementiers comme Faurecia, Auto Chassis International (groupe Renault), NTN-SNR, Delphi ou Valeo, qui proposent des postes en production, qualité, logistique, maintenance et ingénierie.</li><li><span style=\"font-weight: bold;color:#0063cb\">L'agroalimentaire</span> est un autre pilier avec des acteurs majeurs comme Bel (fromages), LDC (volailles), Bahier, Madrange ou les rillettes Bordeau-Chesnel, qui recrutent sur des postes industriels, qualité, supply chain et commerce.</li><li><span style=\"font-weight: bold;color:#0063cb\">La santé et les services publics</span> représentent un bassin d'emploi important avec le Centre hospitalier du Mans (plus de 5 000 agents, 2ᵉ CHU de la région), l'agglomération Le Mans Métropole et les collectivités locales.</li><li>Le commerce, la logistique (profitant de la position autoroutière A11/A28/A81) et les PME/ETI industrielles de la Sarthe complètent cet écosystème.</li></ul><span style=\"font-weight: bold;color:#0063cb\">Avec un taux de chômage proche de la moyenne nationale et un coût de la vie modéré</span>, Le Mans est une ville où l'alternance permet à la fois d'entrer dans de grands groupes et de se constituer rapidement un réseau professionnel solide.",
        activites: [],
      },
      mobilite: {
        text: '<span style="font-weight: bold;color:#0063cb">Se déplacer au Mans est simple et peu coûteux</span> grâce au réseau Setram, qui exploite deux lignes de tramway (T1 et T2) et une quarantaine de lignes de bus desservant l\'agglomération. Le tramway relie notamment la gare, le centre-ville, l\'Université et les principaux quartiers résidentiels, avec une fréquence élevée aux heures de pointe.<br /><br /><span style="font-weight: bold;color:#0063cb">L\'abonnement mensuel Setram coûte environ 33 euros pour les moins de 26 ans</span>, un tarif très accessible pour les alternants, avec la prise en charge à 50 % par l\'employeur. La ville développe aussi ses infrastructures cyclables avec plus de <span style="font-weight: bold;color:#0063cb">150 km de pistes et bandes cyclables</span> et un service de vélos en libre-service (Mobiviel), particulièrement adapté au relief plutôt plat du centre-ville.<br /><br />La <span style="font-weight: bold;color:#0063cb">gare du Mans est un nœud ferroviaire majeur</span> : Paris-Montparnasse est accessible en 55 minutes en TGV, Rennes en 1h, Nantes en 1h30 et Angers en 40 minutes, ce qui permet d\'envisager des alternances partagées entre Le Mans et les métropoles voisines. Pour les zones d\'activité situées en périphérie (Allonnes, Arnage, zone Nord), les lignes de bus Setram et le covoiturage restent les options les plus efficaces.',
        transports: [
          { label: "2 lignes de tramway Setram", type: "tramway" },
          { label: "Bus Setram", type: "bus" },
          { label: "Pistes cyclables et Mobiviel", type: "velo" },
          { label: "Gare TGV (Paris en 55 min)", type: "tgv" },
          { label: "Trains régionaux TER", type: "train" },
          { label: "Covoiturage et autopartage", type: "voiture" },
        ],
      },
      logement: {
        text: `<span style="font-weight: bold;color:#0063cb">Le Mans est l'une des villes les plus abordables de France pour se loger</span>, ce qui en fait une destination particulièrement intéressante pour les alternants. Pour un studio, comptez entre 350 et 500 euros charges comprises selon le quartier et l'état du bien, tandis qu'un T2 se situe généralement entre 450 et 650 euros.<ul><li>Les quartiers les plus appréciés des étudiants et alternants sont <span style="font-weight: bold;color:#0063cb">le centre-ville, la Cité Plantagenêt et le quartier de la gare</span>, pour leur proximité immédiate avec les commerces, les transports et la vie nocturne.</li><li><span style="font-weight: bold;color:#0063cb">Les Jacobins, le Vieux-Mans et Bollée</span> offrent un bon compromis entre calme, patrimoine et accessibilité en tramway.</li><li><span style="font-weight: bold;color:#0063cb">Les quartiers de Pontlieue, Université et Ronceray-Glonnières</span> proposent des loyers plus modérés, avec une desserte directe vers Le Mans Université et les zones d'activité.</li></ul><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches au moins un à deux mois avant la rentrée</span> sur les plateformes classiques (Leboncoin, PAP, SeLoger) et via les groupes Facebook dédiés au logement étudiant au Mans. Les résidences CROUS et les résidences étudiantes privées complètent l'offre avec des studios meublés tout équipés. ${MON_LOGEMENT_ETUDIANT_LINK} est un service public ayant pour objectif de faciliter l'accès au logement étudiant et référence plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style="font-weight: bold;color:#0063cb">N'oubliez pas que vous pouvez bénéficier des APL</span> pour réduire votre loyer mensuel, et certains employeurs proposent une aide au logement dans le cadre du contrat d'alternance, pensez à vous renseigner auprès de votre entreprise d'accueil.`,
        loyers: [
          { type: "Studio", price_range: "350 - 500€" },
          { type: "T2", price_range: "450 - 650€" },
        ],
      },
      loisirs: {
        text: 'Le Mans offre une vie culturelle et sportive riche, à taille humaine, qui permet aux alternants de s\'épanouir en dehors du travail.<ul><li><span style="font-weight: bold;color:#0063cb">La Cité Plantagenêt, le plus grand quartier médiéval classé de France</span>, est le cœur battant de la ville avec ses rues pavées, ses maisons à colombages et ses nombreux cafés et restaurants fréquentés par les étudiants et les jeunes actifs.</li><li><span style="font-weight: bold;color:#0063cb">La scène culturelle est portée par des équipements structurants</span> comme les Quinconces-L\'Espal (scène nationale), la salle Oasis, le Palais des congrès et de la culture, les Musées du Mans (Carré Plantagenêt, musée de Tessé) et le cinéma d\'art et essai Les Cinéastes.</li><li><span style="font-weight: bold;color:#0063cb">Les berges de la Sarthe et de l\'Huisne</span>, ainsi que le parc de Tessé, l\'arche de la Nature et le parc des Étangs Chauds, offrent de vastes espaces verts pour courir, faire du vélo ou simplement décompresser après le travail.</li><li><span style="font-weight: bold;color:#0063cb">Le sport occupe une place centrale</span> avec Le Mans FC (football), le MSB - Le Mans Sarthe Basket (Pro A), l\'ACO (Automobile Club de l\'Ouest) et un tissu associatif dense pour la pratique amateur.</li><li><span style="font-weight: bold;color:#0063cb">Les 24 Heures du Mans</span>, course automobile d\'endurance la plus célèbre au monde, constituent un rendez-vous professionnel majeur pour toute la filière automobile, événementielle, hospitality, logistique et médias — un terrain d\'expérience unique pour les alternants de ces secteurs.</li><li>Les festivals rythment aussi l\'année, notamment <span style="font-weight: bold;color:#0063cb">La Nuit des Chimères (mise en lumière du patrimoine), Europajazz ou Le Mans fait son cirque</span>, tandis que la vie nocturne étudiante se concentre autour de la place de l\'Éperon, de la rue du Docteur Leroy et du quartier de la gare.</li></ul>',
        types: [
          { label: "Patrimoine Plantagenêt", type: "promenade" },
          { label: "Scène culturelle", type: "concert" },
          { label: "Musées et expositions", type: "musee" },
          { label: "Sport et filière automobile", type: "sport" },
          { label: "Berges et parcs urbains", type: "quai" },
          { label: "Vie nocturne étudiante", type: "bar" },
        ],
      },
    },
  },
  {
    ville: "Besançon",
    cp: "25000",
    slug: "besancon",
    region: "Bourgogne-Franche-Comté",
    geopoint: {
      lat: 47.237829,
      long: 6.024054,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "capitale historique de la Franche-Comté",
        text: "Besançon, préfecture du Doubs et ancienne capitale de la Franche-Comté, compte près de <strong>120 000 habitants</strong> et plus de <strong>200 000 habitants</strong> dans le Grand Besançon Métropole. Enchâssée dans une boucle spectaculaire du Doubs et dominée par la Citadelle de Vauban classée au patrimoine mondial de l'UNESCO, la ville offre un cadre de vie singulier, à la fois historique et verdoyant, régulièrement citée parmi les villes les plus agréables de France pour y étudier. Pôle universitaire majeur du Grand Est, Besançon accueille près de <strong>30 000 étudiants</strong> grâce à l'Université de Franche-Comté, à l'ENSMM (école nationale supérieure de mécanique et des microtechniques) et à plusieurs écoles d'ingénieurs et de commerce, ce qui entretient une ambiance jeune et dynamique. Pour un alternant, Besançon représente un excellent compromis : un tissu économique d'excellence dans les microtechniques, la santé et les biotechnologies, des loyers très abordables par rapport aux grandes métropoles, et une position stratégique avec la gare TGV qui met Paris à 2h10 et Lyon à 2h30. La ville conjugue sérieux académique, patrimoine remarquable et immédiate proximité avec la nature (collines boisées, rivière, forêts de Chailluz).",
        image: "besancon.png",
      },
      vie: {
        text: "Le tissu économique bisontin est <span style=\"font-weight: bold;color:#0063cb\">structuré autour de filières d'excellence</span> qui en font un terrain d'alternance particulièrement favorable.<ul><li><span style=\"font-weight: bold;color:#0063cb\">Les microtechniques et l'horlogerie</span> constituent le pilier historique et mondialement reconnu de l'économie locale, portés par le pôle de compétitivité Microtechniques et des acteurs comme Cheval Frères, Statice, Zadient Technologies ou la Manufacture Française des Pneumatiques Michelin.</li><li><span style=\"font-weight: bold;color:#0063cb\">La santé et les biotechnologies</span> sont un secteur particulièrement dynamique avec le CHU Jean-Minjoz (un des plus gros employeurs de la région), l'Établissement Français du Sang Bourgogne-Franche-Comté et des entreprises comme Cisbio Bioassays ou Statice Santé spécialisées dans les dispositifs médicaux.</li><li><span style=\"font-weight: bold;color:#0063cb\">L'industrie et l'ingénierie</span> s'appuient sur des leaders comme Alstom (à Ornans, à 25 minutes), Schrader Pacific ou Parkeon, qui recrutent régulièrement des alternants en mécanique, électronique, qualité et production.</li><li><span style=\"font-weight: bold;color:#0063cb\">La recherche et la tech</span> se développent fortement autour de l'institut FEMTO-ST, l'un des plus importants laboratoires de sciences pour l'ingénieur de France (plus de 700 chercheurs), et de TEMIS Innovation, technopôle qui héberge start-ups et PME innovantes dans les microtechnologies, la mécatronique et le numérique.</li><li>Les institutions publiques (préfecture, conseil régional, rectorat), le secteur bancaire (Crédit Agricole Franche-Comté, Caisse d'Épargne) et les services aux entreprises complètent un marché de l'alternance varié.</li></ul><span style=\"font-weight: bold;color:#0063cb\">Avec un taux de chômage légèrement inférieur à la moyenne nationale et une politique active en faveur de l'apprentissage</span>, Besançon propose chaque année un volume de contrats d'alternance attractif, avec souvent une concurrence moins forte que dans les grandes métropoles.",
        activites: [],
      },
      mobilite: {
        text: '<span style="font-weight: bold;color:#0063cb">Se déplacer à Besançon est simple et peu coûteux</span> grâce au réseau Ginko, qui couvre l\'ensemble du Grand Besançon Métropole. Le réseau s\'articule autour de <span style="font-weight: bold;color:#0063cb">2 lignes de tramway</span> inaugurées en 2014, reliant les Hauts-du-Chazal à Chalezeule en passant par le centre-ville, les campus universitaires et le CHU, complétées par une trentaine de lignes de bus et des navettes urbaines gratuites dans le centre (Ginko City).<br /><br /><span style="font-weight: bold;color:#0063cb">L\'abonnement mensuel jeune Ginko est à environ 25 euros pour les moins de 26 ans</span>, l\'un des tarifs les plus compétitifs de France, et votre entreprise d\'accueil prend en charge 50% de votre abonnement, ce qui ramène le coût réel à environ 12,50 euros par mois.<br /><br />Besançon est également très adaptée au vélo, avec plus de <span style="font-weight: bold;color:#0063cb">75 km d\'aménagements cyclables</span> dont la voie verte le long du Doubs, et le service VéloCité propose des vélos en libre-service dans une trentaine de stations. Le centre historique, largement piétonnier autour de la Grande Rue, se parcourt aisément à pied.<br /><br />Pour les liaisons longue distance, la gare <span style="font-weight: bold;color:#0063cb">Besançon-Viotte en plein centre dessert Paris en 2h10, Lyon en 2h30 et Strasbourg en 2h15</span>, et la gare Besançon Franche-Comté TGV (à 15 minutes en TER depuis Viotte) complète l\'offre TGV avec des liaisons directes vers la plupart des grandes villes françaises. Le covoiturage est très développé sur l\'axe Besançon-Dijon-Lyon grâce à la proximité de l\'A36.',
        transports: [
          { label: "Tramway Ginko (2 lignes)", type: "tramway" },
          { label: "Bus Ginko", type: "bus" },
          { label: "VéloCité", type: "velo" },
          { label: "Centre-ville piétonnier", type: "pieton" },
          { label: "Gare Besançon-Viotte TGV", type: "tgv" },
          { label: "TER Franche-Comté", type: "train" },
        ],
      },
      logement: {
        text: `Trouver un logement à Besançon <span style="font-weight: bold;color:#0063cb">reste très accessible par rapport aux grandes métropoles</span>, même si la demande se tend nettement à la rentrée universitaire. Pour un studio, comptez entre 350 et 500 euros charges comprises selon le quartier et l'état du bien, tandis qu'un T2 se situe généralement entre 500 et 700 euros.<ul><li>Les quartiers les plus prisés par les étudiants et alternants sont <span style="font-weight: bold;color:#0063cb">Battant, Saint-Jean et Bouclier</span>, au cœur de la boucle historique, parfaits pour profiter à pied des campus du centre et de la vie étudiante.</li><li><span style="font-weight: bold;color:#0063cb">Les Montboucons, La Bouloie et Bregille</span>, proches du grand campus universitaire, offrent un bon compromis entre loyers abordables et accès direct aux facs par le tram et les bus.</li><li><span style="font-weight: bold;color:#0063cb">Palente, Planoise ou Chalezeule</span>, bien reliés par le tram, proposent les logements les plus abordables de la métropole et conviennent parfaitement aux budgets serrés.</li></ul><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches au moins deux mois avant la rentrée</span> sur les plateformes classiques (Leboncoin, PAP, SeLoger) et via les groupes Facebook dédiés au logement étudiant à Besançon, très actifs. Consultez ${MON_LOGEMENT_ETUDIANT_LINK}, pour découvrir de nombreux conseils et les logements disponibles dans votre secteur. Les résidences du CROUS Bourgogne-Franche-Comté proposent des chambres à partir de 280 euros, et les résidences privées (Studéa, Nexity Studéa) offrent des studios meublés à partir de 450 euros. <span style="font-weight: bold;color:#0063cb">N'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer mensuel</span>. Certains employeurs proposent également une aide au logement dans le cadre du contrat d'alternance, pensez à vous renseigner. Un dossier solide avec garants reste apprécié sur les biens les plus recherchés du centre historique.`,
        loyers: [
          { type: "Studio", price_range: "350 - 500€" },
          { type: "T2", price_range: "500 - 700€" },
        ],
      },
      loisirs: {
        text: 'Besançon offre une vie culturelle et sportive riche qui ravira les alternants en quête d\'équilibre entre vie professionnelle et détente.<ul><li><span style="font-weight: bold;color:#0063cb">La Citadelle de Vauban</span>, classée au patrimoine mondial de l\'UNESCO, domine la ville et abrite trois musées (Musée comtois, Muséum d\'histoire naturelle, Musée de la Résistance et de la Déportation), avec des tarifs réduits pour les moins de 26 ans.</li><li><span style="font-weight: bold;color:#0063cb">Les nombreux bars et cafés</span> de la rue Claude-Pouillet, de la place Granvelle et du quartier Battant animent les soirées étudiantes, avec une ambiance particulièrement vivante le jeudi soir.</li><li><span style="font-weight: bold;color:#0063cb">La scène musicale</span> est portée par La Rodia (scène de musiques actuelles), le Kursaal, la Friche artistique et l\'Opéra de Besançon, qui proposent une programmation variée et accessible aux petits budgets.</li><li><span style="font-weight: bold;color:#0063cb">Les amateurs de culture</span> profitent du Musée des Beaux-Arts et d\'Archéologie (le plus ancien musée de France, entièrement rénové), du FRAC Bourgogne-Franche-Comté et des cinémas d\'art et essai Victor Hugo et Mégarama.</li><li><span style="font-weight: bold;color:#0063cb">Les amateurs de nature et de sport</span> profitent des berges du Doubs, de la voie verte, du parc Micaud et des collines boisées qui encerclent la ville (forêt de Chailluz, promenades Chamars et Granvelle), idéales pour courir, pédaler ou randonner en sortant du bureau.</li><li><span style="font-weight: bold;color:#0063cb">Les festivals rythment l\'année</span>, notamment le Festival international de musique de Besançon, Détonation (musiques actuelles) et le festival Livres dans la Boucle.</li></ul>',
        types: [
          { label: "Patrimoine historique", type: "promenade" },
          { label: "Vie nocturne", type: "bar" },
          { label: "Concerts et opéra", type: "concert" },
          { label: "Musées", type: "musee" },
          { label: "Nature et randonnée", type: "montagne" },
          { label: "Festivals", type: "musique" },
        ],
      },
    },
  },
  {
    ville: "Amiens",
    cp: "80000",
    slug: "amiens",
    region: "Hauts-de-France",
    geopoint: {
      lat: 49.894067,
      long: 2.295753,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "capitale de la Picardie",
        text: "Amiens, préfecture de la Somme et capitale historique de la Picardie, est une ville de près de <strong>135 000 habitants</strong> (près de 180 000 dans la métropole Amiens Métropole) qui attire de plus en plus d'alternants. Dominée par sa cathédrale Notre-Dame, plus grande cathédrale gothique de France classée au patrimoine mondial de l'UNESCO, la ville a su conjuguer patrimoine exceptionnel et dynamisme économique. À seulement <strong>1h10 de Paris</strong> en train, Amiens offre un cadre urbain à taille humaine tout en restant connectée à la capitale. La ville compte près de <strong>30 000 étudiants</strong>, principalement à l'Université de Picardie Jules Verne (UPJV), créant une ambiance jeune et animée dans le centre-ville et autour du quartier Saint-Leu. Pour un alternant, Amiens représente un excellent compromis : un tissu économique industriel et tertiaire solide, un coût de la vie nettement plus abordable qu'à Paris ou Lille, une vie étudiante active et des quartiers rénovés comme Saint-Leu ou la gare. Les hortillonnages, ces jardins flottants parcourus en barque, et la Somme qui traverse la ville apportent une respiration verte appréciable pour un début de carrière professionnelle.",
        image: "amiens.png",
      },
      vie: {
        text: 'Le tissu économique amiénois est <span style="font-weight: bold;color:#0063cb">diversifié et porté par une forte tradition industrielle</span>, offrant un large éventail d\'opportunités aux alternants.<ul><li><span style="font-weight: bold;color:#0063cb">L\'agroalimentaire</span> constitue un pilier majeur avec des acteurs comme Bonduelle, Tereos (sucre), Nestlé Purina et Ajinomoto Foods Europe qui recrutent régulièrement en production, qualité, maintenance et supply chain.</li><li><span style="font-weight: bold;color:#0063cb">La cosmétique et la santé</span> sont particulièrement dynamiques, avec Procter &amp; Gamble (usine historique), Colgate-Palmolive, ainsi que le CHU Amiens-Picardie qui est l\'un des plus grands employeurs du département.</li><li><span style="font-weight: bold;color:#0063cb">L\'industrie et l\'automobile</span> restent bien représentées avec Valeo (équipementier automobile), Goodyear, Dunlop et un écosystème de sous-traitants de rang 1 et 2 sur la zone Amiens Nord.</li><li><span style="font-weight: bold;color:#0063cb">Le numérique et la French Tech Hauts-de-France</span> se développent notamment autour du pôle Citadelle et des espaces de coworking du centre-ville, avec des startups et ESN qui recrutent des alternants en développement, data et cybersécurité.</li><li>Les secteurs <span style="font-weight: bold;color:#0063cb">banque-assurance (Crédit Agricole Brie Picardie, Groupama), commerce et logistique</span> complètent ce panorama, soutenus par la position d\'Amiens sur l\'axe Paris-Lille.</li></ul><span style="font-weight: bold;color:#0063cb">Avec un bassin d\'emploi de plus de 120 000 postes</span>, Amiens offre aux alternants un marché accessible où la concurrence est moins forte qu\'en région parisienne, avec des entreprises ouvertes aux profils en formation.',
        activites: [],
      },
      mobilite: {
        text: '<span style="font-weight: bold;color:#0063cb">Se déplacer à Amiens est simple et abordable</span> grâce au réseau Ametis qui dessert l\'ensemble de l\'agglomération. Le réseau s\'articule autour de <span style="font-weight: bold;color:#0063cb">quatre lignes de Bus à Haut Niveau de Service (Nemo)</span> qui relient les principaux pôles d\'activité et les campus, complétées par une vingtaine de lignes de bus classiques couvrant les communes voisines comme Longueau, Camon ou Pont-de-Metz.<br /><br /><span style="font-weight: bold;color:#0063cb">L\'abonnement mensuel jeune (-26 ans) coûte environ 24 euros</span>, un tarif parmi les plus avantageux de France pour les alternants, qui bénéficient en plus d\'une prise en charge à 50% par leur employeur. Le service Vélam propose plus de 300 vélos en libre-service dans une trentaine de stations <span style="font-weight: bold;color:#0063cb">à partir de 20 euros par an</span>, et le réseau cyclable de la métropole s\'étend sur près de 100 km, avec des pistes sécurisées le long de la Somme et dans le centre-ville piéton.<br /><br /><span style="font-weight: bold;color:#0063cb">La gare d\'Amiens</span> permet de rejoindre Paris Gare du Nord en 1h10 avec des trains fréquents, idéal pour les alternants qui gardent un pied dans la capitale, ainsi que Lille en 1h15, Rouen en 1h20 et Boulogne-sur-Mer en 1h30. Amiens est également bien reliée par les autoroutes A16, A29 et A1, ce qui facilite les déplacements vers l\'ensemble des Hauts-de-France.',
        transports: [
          { label: "BHNS Nemo", type: "bus" },
          { label: "Bus Ametis", type: "bus" },
          { label: "Vélam libre-service", type: "velo" },
          { label: "100 km de pistes cyclables", type: "trottinette" },
          { label: "Centre-ville piéton", type: "pieton" },
          { label: "Gare d'Amiens", type: "tgv" },
        ],
      },
      logement: {
        text: `Trouver un logement à Amiens <span style="font-weight: bold;color:#0063cb">est particulièrement accessible pour les alternants</span>, avec des loyers parmi les plus bas des grandes villes françaises. Pour un studio, comptez entre 350 et 500 euros charges comprises selon le quartier et l'état du bien, tandis qu'un T2 se situe généralement entre 500 et 700 euros.<ul><li>Les quartiers les plus prisés par les étudiants et alternants sont <span style="font-weight: bold;color:#0063cb">Saint-Leu</span>, quartier historique animé au bord de la Somme, qui concentre la vie étudiante avec ses maisons colorées et ses terrasses.</li><li><span style="font-weight: bold;color:#0063cb">Le centre-ville (Hôtel de Ville, Cathédrale, Henriville)</span> propose des logements bien situés à proximité des campus et des entreprises, avec un bon rapport qualité-prix.</li><li><span style="font-weight: bold;color:#0063cb">La Citadelle et le Pigeonnier</span>, proches du nouveau campus UPJV, attirent les étudiants avec des résidences récentes, tandis que <span style="font-weight: bold;color:#0063cb">le quartier de la Gare et Saint-Roch</span> séduit les alternants faisant des allers-retours sur Paris.</li></ul><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches au moins deux mois avant la rentrée</span> sur les plateformes classiques (Leboncoin, PAP, SeLoger) et les groupes Facebook dédiés au logement étudiant à Amiens. Les résidences CROUS proposent des logements entre 230 et 400 euros, mais la demande est forte. ${MON_LOGEMENT_ETUDIANT_LINK} est un service public ayant pour objectif de faciliter l'accès au logement étudiant et référence plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style="font-weight: bold;color:#0063cb">N'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer mensuel</span>, et que la garantie Visale d'Action Logement (gratuite pour les moins de 30 ans) peut remplacer un garant physique. Certains employeurs proposent également une aide au logement dans le cadre du contrat d'alternance, pensez à vous renseigner.`,
        loyers: [
          { type: "Studio", price_range: "350 - 500€" },
          { type: "T2", price_range: "500 - 700€" },
        ],
      },
      loisirs: {
        text: 'Amiens offre une <span style="font-weight: bold;color:#0063cb">vie culturelle et associative riche</span> qui séduira les alternants en quête d\'équilibre entre vie professionnelle et détente.<ul><li><span style="font-weight: bold;color:#0063cb">Le quartier Saint-Leu</span>, surnommé la "petite Venise du Nord" avec ses canaux et ses maisons colorées, concentre l\'animation du soir avec ses nombreux bars et restaurants à budget étudiant, en particulier autour de la place du Don et du quai Bélu.</li><li><span style="font-weight: bold;color:#0063cb">Les hortillonnages</span>, 300 hectares de jardins flottants parcourus à pied ou en barque, offrent un terrain de promenade unique en France, à quelques minutes seulement du centre-ville.</li><li><span style="font-weight: bold;color:#0063cb">La scène culturelle</span> est animée par la Maison de la Culture (scène nationale), le Zénith d\'Amiens, la Lune des Pirates (scène de musiques actuelles) et le Ciné Saint-Leu, cinéma d\'art et essai historique.</li><li><span style="font-weight: bold;color:#0063cb">Les musées gratuits pour les moins de 26 ans</span> (musée de Picardie rénové, musée Jules Verne, maison de Jules Verne) enrichissent l\'offre culturelle, tandis que le spectacle <span style="font-weight: bold;color:#0063cb">Chroma projeté sur la cathédrale</span> attire chaque année des milliers de visiteurs.</li><li><span style="font-weight: bold;color:#0063cb">Le sport</span> est accessible avec le Coliseum, les piscines municipales à tarifs étudiants, les clubs de basket (SLUC) et de football (ASC) et de nombreux équipements associatifs pour pratiquer à prix réduit.</li><li><span style="font-weight: bold;color:#0063cb">Les festivals</span> rythment l\'année : Festival International du Film d\'Amiens, Minuit Zéro Une (musiques actuelles), Tendance Hip-Hop et les rendez-vous étudiants de l\'UPJV.</li></ul>',
        types: [
          { label: "Hortillonnages et promenade", type: "promenade" },
          { label: "Musées et patrimoine", type: "musee" },
          { label: "Bords de Somme", type: "quai" },
          { label: "Vie nocturne Saint-Leu", type: "bar" },
          { label: "Concerts et théâtre", type: "concert" },
          { label: "Sport", type: "sport" },
        ],
      },
    },
  },
  {
    ville: "Pau",
    cp: "64000",
    slug: "pau",
    region: "Nouvelle-Aquitaine",
    geopoint: {
      lat: 43.295124,
      long: -0.370797,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "préfecture des Pyrénées-Atlantiques",
        text: "Pau, préfecture des Pyrénées-Atlantiques, compte près de 77 000 habitants intra-muros et environ 240 000 dans son agglomération. Installée face à la chaîne des Pyrénées, la ville est structurée autour de son château historique, du Boulevard des Pyrénées et d'un centre-ville piéton compact qui la rend agréable à vivre au quotidien. Pau accueille plus de 15 000 étudiants, principalement à l'Université de Pau et des Pays de l'Adour (UPPA), ainsi que dans plusieurs écoles d'ingénieurs et de commerce (ESC Pau Business School, CESI, ISA BTP). Pour un alternant, Pau présente un équilibre intéressant entre un marché de l'emploi concentré autour de quelques filières fortes (aéronautique, énergie, numérique) et un coût de la vie nettement inférieur à celui des grandes métropoles. La ville mise depuis plusieurs années sur sa transition écologique avec le Fébus, premier bus à hydrogène à haut niveau de service en France, et sur une économie soutenue par des acteurs industriels majeurs implantés localement. Son format à taille humaine permet de se déplacer rapidement entre centre de formation, entreprise et logement, un atout concret pour enchaîner les semaines en alternance.",
        image: "pau.png",
      },
      vie: {
        text: "Le tissu économique palois est <span style=\"font-weight: bold;color:#0063cb\">organisé autour de quelques filières industrielles et tertiaires structurantes</span>, qui recrutent régulièrement des alternants.<ul><li><span style=\"font-weight: bold;color:#0063cb\">L'aéronautique et la propulsion</span> constituent un pilier historique du bassin, avec Safran Helicopter Engines à Bordes (premier employeur privé du département), Dassault Aviation, Turboméca et un réseau dense de sous-traitants. Les postes en alternance couvrent la production, la maintenance, la qualité, la supply chain et l'ingénierie.</li><li><span style=\"font-weight: bold;color:#0063cb\">Le secteur de l'énergie</span> reste très présent, avec le pôle scientifique et technique de TotalEnergies (CSTJF), qui regroupe plusieurs milliers de salariés et recrute chaque année en géosciences, data, IT et fonctions support. Arkema et Teréga (transport de gaz) complètent ce pôle.</li><li><span style=\"font-weight: bold;color:#0063cb\">Le numérique et le tertiaire</span> se développent autour de la technopole Hélioparc et de la French Tech Pau - Béarn Pays Basque, qui rassemble une centaine de startups et d'ETI actives dans la data, l'IoT, l'environnement et la santé.</li><li>L'agroalimentaire (Euralis, Lindt, Blédina à proximité), la grande distribution, le BTP et les services publics complètent l'offre d'alternance, à quoi s'ajoutent un CHU (Centre hospitalier de Pau) et de nombreuses PME locales.</li></ul><span style=\"font-weight: bold;color:#0063cb\">Avec un taux de chômage parmi les plus bas de Nouvelle-Aquitaine</span>, le bassin palois combine des employeurs de taille nationale et un maillage d'entreprises de proximité, utile pour décrocher une alternance sans multiplier les déplacements.",
        activites: [],
      },
      mobilite: {
        text: "Pau dispose d'<span style=\"font-weight: bold;color:#0063cb\">un réseau de transports en commun Idelis bien dimensionné pour une ville de cette taille</span>, exploité par la Communauté d'agglomération Pau Béarn Pyrénées. Le réseau compte une quarantaine de lignes de bus, complétées par le Fébus, un bus à haut niveau de service 100 % électrique à hydrogène qui traverse la ville d'est en ouest et dessert notamment la gare, le centre-ville, le CHU et l'hôpital.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">L'abonnement mensuel jeune coûte environ 23 € pour les moins de 26 ans</span>, avec une formule annuelle à tarif réduit pour les étudiants et alternants, ce qui en fait l'un des réseaux urbains les plus abordables de sa catégorie.<br /><br />La ville est compacte : on traverse le centre à pied en <span style=\"font-weight: bold;color:#0063cb\">une vingtaine de minutes</span>, et plus de 100 km d'aménagements cyclables couvrent l'agglomération. Le service de vélos IDEcycle propose de la location longue durée, y compris en version à assistance électrique, à des tarifs préférentiels pour les étudiants.<br /><br />Côté longue distance, <span style=\"font-weight: bold;color:#0063cb\">la gare de Pau permet de rejoindre Bordeaux en 2h, Toulouse en 2h30 et Paris en environ 4h via TGV</span>. Des liaisons TER régulières desservent Bayonne, Tarbes, Lourdes et Oloron-Sainte-Marie, utiles pour les alternants dont l'entreprise ou le centre de formation se situe sur le reste du bassin.",
        transports: [
          { label: "Bus Idelis", type: "bus" },
          { label: "Fébus (BHNS hydrogène)", type: "bus" },
          { label: "Pistes cyclables", type: "velo" },
          { label: "Centre-ville piéton", type: "pieton" },
          { label: "Gare TGV et TER", type: "tgv" },
        ],
      },
      logement: {
        text: `Le marché du logement à Pau est <span style=\"font-weight: bold;color:#0063cb\">l'un des plus accessibles parmi les villes universitaires françaises</span>, ce qui constitue un avantage réel pour un alternant qui démarre. Pour un studio, comptez entre 350 et 500 € charges comprises selon le quartier et l'état du bien, et entre 450 et 650 € pour un T2.<ul><li>Les secteurs <span style=\"font-weight: bold;color:#0063cb\">Centre-ville, Les Halles et le quartier du Hédas</span> sont plébiscités par les étudiants pour leur vie de quartier, leur offre de commerces et leur proximité avec les lignes de bus principales.</li><li><span style=\"font-weight: bold;color:#0063cb\">Saragosse et Dufau-Tourasse</span> offrent des loyers plus bas et une bonne desserte, avec de nombreuses résidences étudiantes et sociales.</li><li><span style=\"font-weight: bold;color:#0063cb\">Trespoey et Le Hameau</span>, plus résidentiels, conviennent aux alternants qui cherchent un cadre calme, pour un loyer intermédiaire.</li></ul>Pau compte plusieurs résidences CROUS à tarifs contenus (à partir d'environ 250 €) et un parc privé abondant. Rendez-vous sur ${MON_LOGEMENT_ETUDIANT_LINK}, un service public ayant pour objectif de faciliter l'accès au logement étudiant pour découvrir plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style=\"font-weight: bold;color:#0063cb\">N'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer mensuel</span>, et certains employeurs prennent en charge une partie du logement dans le cadre du contrat d'alternance. Il est recommandé de démarrer les recherches environ 1 à 2 mois avant la rentrée, en prévoyant un dossier avec garants pour sécuriser l'accès aux biens les plus demandés.`,
        loyers: [
          { type: "Studio", price_range: "350 - 500€" },
          { type: "T2", price_range: "450 - 650€" },
        ],
      },
      loisirs: {
        text: "Pau offre une vie culturelle et sportive dense pour sa taille, avec une identité forte marquée par la proximité des Pyrénées.<ul><li><span style=\"font-weight: bold;color:#0063cb\">Le Boulevard des Pyrénées et le parc Beaumont</span> sont les lieux de promenade emblématiques de la ville, avec une vue dégagée sur la chaîne de montagnes, utiles pour décompresser après une journée de travail ou de cours.</li><li><span style=\"font-weight: bold;color:#0063cb\">Le Château de Pau et le musée des Beaux-Arts</span> proposent une programmation régulière avec des tarifs réduits pour les moins de 26 ans. Le Bel Ordinaire, centre d'art contemporain installé à Billère, complète l'offre culturelle plus alternative.</li><li><span style=\"font-weight: bold;color:#0063cb\">La scène musicale</span> s'appuie sur des salles comme la Route du Son (SMAC), le Zénith de Pau et l'Ampli, avec une programmation concerts, musiques actuelles et spectacles tout au long de l'année.</li><li><span style=\"font-weight: bold;color:#0063cb\">Le sport tient une place centrale</span> : la Section Paloise (Top 14) et l'Élan Béarnais Pau-Lacq-Orthez (basket pro) animent les soirées de match, et la ville dispose de nombreuses infrastructures municipales (piscines, salles d'escalade, stade d'eaux vives du Stade d'Eaux Vives pour le canoë-kayak).</li><li><span style=\"font-weight: bold;color:#0063cb\">La montagne est à moins d'une heure</span>, avec des spots de randonnée, VTT et ski accessibles en journée depuis Pau, une possibilité concrète pour les alternants qui pratiquent les sports outdoor sans avoir besoin de partir en séjour.</li><li>Les festivals rythment le calendrier, notamment <span style=\"font-weight: bold;color:#0063cb\">Hestiv'Òc et les événements étudiants</span> portés par l'UPPA et les écoles du campus.</li></ul>",
        types: [
          { label: "Promenade", type: "promenade" },
          { label: "Musées", type: "musee" },
          { label: "Concerts", type: "concert" },
          { label: "Rugby et basket", type: "rugby" },
          { label: "Sport outdoor", type: "montagne" },
          { label: "Cinéma", type: "cinema" },
        ],
      },
    },
  },
]

export const up = async () => {
  logger.info("Ajout de 10 nouvelles villes SEO (batch 2) dans seo_villes")

  const now = new Date()

  await getDbCollection("seo_villes").insertMany(
    villeData.map((ville) => ({ ...ville, _id: new ObjectId(), cards: [], created_at: now, updated_at: now })),
    { ordered: false, bypassDocumentValidation: true }
  )

  await updateSEO()

  logger.info("Ajout de 10 villes SEO (batch 2) terminé")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
