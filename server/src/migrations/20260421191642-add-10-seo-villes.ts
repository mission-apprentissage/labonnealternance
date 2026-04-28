// Migration : ajout de 10 nouvelles pages ville SEO (/alternance/ville/[ville])
//
// Villes ajoutées : Lille, Nice, Annecy, Reims, Rouen, Tours, Dijon, Clermont-Ferrand, Metz, Saint-Étienne
//
// À FAIRE POUR LE DÉPLOIEMENT :
//   1. Déposer ce fichier dans server/src/migrations/
//   2. Déposer 10 images dans ui/public/images/seo/ville/ :
//      lille.png, nice.png, annecy.png, reims.png, rouen.png,
//      tours.png, dijon.png, clermont-ferrand.png, metz.png, saint-etienne.png
//   3. Lancer : yarn migrations:up
//
// Le up() ci-dessous :
//   - insère les 10 villes dans seo_villes (pas de deleteMany — migration additive, les 10 villes existantes sont préservées)
//   - appelle updateSEO() qui remplit automatiquement job_count, recruteur_count, cards, content.vie.activites
//     via les jobs CRON updateSeoVilleJobCounts + updateSeoVilleActivities
//
// Aucun champ calculable côté back (job_count, recruteur_count, cards, activites) n'est renseigné :
// ils sont initialisés à 0 / [] et seront peuplés par updateSEO() à l'exécution.

import { ObjectId } from "mongodb"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { updateSEO } from "@/jobs/seo/updateSEO"

const MON_LOGEMENT_ETUDIANT_LINK = `<a href="https://monlogementetudiant.beta.gouv.fr/trouver-un-logement-etudiant?utm_source=labonnealternance&utm_medium=referral&utm_campaign=partenariat_backlink&utm_content=page_ville" target="_blank" rel="noopener noreferrer" class="lba-link-external" aria-label="Consulter le site Mon Logement Étudiant (ouverture dans un nouvel onglet)">Mon Logement Étudiant</a>`

const villeData = [
  {
    ville: "Lille",
    cp: "59000",
    slug: "lille",
    region: "Hauts-de-France",
    geopoint: {
      lat: 50.62925,
      long: 3.057256,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "capitale des Flandres",
        text: "Lille, capitale des Hauts-de-France, compte près de <strong>235 000 habitants</strong> et plus de <strong>1,2 million d'habitants</strong> dans sa métropole (MEL), ce qui en fait la quatrième aire urbaine française. Nichée au carrefour de l'Europe du Nord, à seulement 1h de Paris en TGV, 35 minutes de Bruxelles et 1h20 de Londres via l'Eurostar, Lille bénéficie d'une position stratégique unique qui en fait une véritable porte d'entrée sur l'Europe. La ville s'est réinventée depuis les années 1990 en passant d'une cité industrielle textile à une métropole tertiaire et étudiante dynamique, portée par des projets structurants comme Euralille. Avec plus de <strong>120 000 étudiants</strong>, Lille figure parmi les premiers pôles universitaires français et affiche une ambiance jeune, festive et conviviale, portée par le fameux \"esprit Ch'ti\". Pour un alternant, Lille représente un excellent compromis : un tissu économique varié, un coût de la vie bien plus abordable que Paris, un patrimoine flamand remarquable (Grand-Place, Vieux-Lille, beffroi classé UNESCO) et une vie étudiante parmi les plus animées de France.",
        image: "lille.png",
      },
      vie: {
        text: 'Le tissu économique lillois est <span style="font-weight: bold;color:#0063cb">particulièrement diversifié</span> et porté par plusieurs fleurons nationaux implantés dans la métropole, ce qui en fait un terrain d\'alternance très favorable. <ul><li><span style="font-weight: bold;color:#0063cb">La grande distribution et le retail</span> constituent le pilier historique de la région avec les sièges sociaux d\'Auchan, Decathlon, Leroy Merlin, Kiabi, Boulanger, Norauto ou encore Pimkie, qui recrutent massivement des alternants en commerce, marketing, supply chain et digital.</li><li><span style="font-weight: bold;color:#0063cb">Le numérique et la tech</span> se sont imposés comme un axe majeur autour d\'EuraTechnologies, l\'un des plus grands incubateurs européens qui accueille plus de 300 entreprises et start-ups, ainsi que des acteurs comme OVHcloud, Adeo ou Worldline.</li><li><span style="font-weight: bold;color:#0063cb">La VPC et le e-commerce</span> gardent une place historique avec La Redoute, 3 Suisses et Showroomprivé, tandis que de nombreuses scale-up comme Vekia ou Meero émergent dans la métropole.</li><li>Le <span style="font-weight: bold;color:#0063cb">secteur bancaire et assurantiel</span> est également puissant avec le Crédit Mutuel Nord Europe, AG2R La Mondiale ou la CIC Nord Ouest.</li><li>Enfin, la <span style="font-weight: bold;color:#0063cb">santé et la recherche</span> s\'appuient sur le CHU de Lille (plus gros employeur de la région), l\'Institut Pasteur et le pôle de compétitivité Eurasanté.</li></ul>Avec un bassin d\'emploi dense et une politique active en faveur de l\'apprentissage, Lille propose chaque année plusieurs milliers de contrats d\'alternance dans tous les secteurs.',
        activites: [],
      },
      mobilite: {
        text: "Se déplacer à Lille et dans la métropole est <span style=\"font-weight: bold;color:#0063cb\">particulièrement simple</span> grâce au réseau Ilévia, qui couvre l'ensemble des 95 communes de la MEL. Lille est célèbre pour avoir inauguré en 1983 le <span style=\"font-weight: bold;color:#0063cb\">premier métro entièrement automatique au monde (VAL)</span>, avec aujourd'hui 2 lignes desservant le centre et l'ensemble de l'agglomération, complétées par 2 lignes de tramway (le Mongy) vers Roubaix et Tourcoing, ainsi qu'une soixantaine de lignes de bus.<br /><br />L'abonnement mensuel jeune Ilévia coûte environ <span style=\"font-weight: bold;color:#0063cb\">33,50€ pour les moins de 26 ans</span>, et votre entreprise d'accueil prend en charge 50% de votre abonnement, ce qui ramène le coût réel à environ 17€. Lille est aussi une ville très cyclable avec plus de <span style=\"font-weight: bold;color:#0063cb\">200 km d'aménagements cyclables</span> et le service V'Lille, qui propose 2 200 vélos en libre-service dans 230 stations, accessible pour environ 36€ par an aux moins de 26 ans.<br /><br />Pour les liaisons longue distance, Lille est <span style=\"font-weight: bold;color:#0063cb\">l'un des meilleurs hubs ferroviaires d'Europe</span> : la gare Lille-Flandres et la gare Lille-Europe permettent de rejoindre Paris en 1h, Bruxelles en 35 min, Londres en 1h20 via l'Eurostar et Amsterdam en 2h30 via le Thalys. L'aéroport de Lille-Lesquin, à 15 min du centre, complète l'offre avec une cinquantaine de destinations européennes.",
        transports: [
          { label: "Métro automatique (VAL)", type: "metro" },
          { label: "Tramway Mongy", type: "tramway" },
          { label: "Bus Ilévia", type: "bus" },
          { label: "V'Lille", type: "velo" },
          { label: "Eurostar, Thalys et TGV", type: "tgv" },
          { label: "Aéroport Lille-Lesquin", type: "aeroport" },
        ],
      },
      logement: {
        text: `Le marché du logement à Lille est <span style="font-weight: bold;color:#0063cb">tendu mais nettement plus abordable qu\'à Paris ou Lyon</span>. Pour un studio de 20 à 25m², il faut compter entre 400 et 600€ charges comprises selon le quartier, et entre 550 et 800€ pour un T2 de 35 à 45m². Les loyers grimpent dans le centre et dans le Vieux-Lille, mais restent raisonnables dans les quartiers étudiants.<ul><li><span style="font-weight: bold;color:#0063cb">Wazemmes et Moulins</span> sont les quartiers les plus populaires auprès des étudiants et alternants : multiculturels, vivants, remplis de bars et de marchés, avec des loyers très accessibles.</li><li><span style="font-weight: bold;color:#0063cb">Vauban-Esquermes</span>, autour des campus des universités catholiques, offre un excellent compromis entre calme et animation étudiante.</li><li>Le <span style="font-weight: bold;color:#0063cb">Vieux-Lille</span> séduit par son charme flamand et ses ruelles pavées, mais affiche les loyers les plus élevés de la ville.</li><li>Pour un budget plus serré, <span style="font-weight: bold;color:#0063cb">Fives, Lille-Sud ou Villeneuve-d\'Ascq</span> (bien reliée par métro) restent très bien desservis et offrent des logements 15 à 20% moins chers.</li></ul>Les résidences CROUS et les résidences étudiantes privées (Studéa, Nexity Studéa, Les Estudines) proposent des studios meublés entre 450 et 700€ par mois, souvent plus chers mais avec services inclus. Rendez-vous sur ${MON_LOGEMENT_ETUDIANT_LINK}, un service public ayant pour objectif de faciliter l\'accès au logement étudiant pour découvrir plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France.<br /><br /><span style="font-weight: bold;color:#0063cb">N\'oubliez pas de demander l\'APL</span> qui peut réduire votre loyer de 100 à 200€ par mois, et pensez à commencer vos recherches au moins 2 mois avant la rentrée sur Leboncoin, PAP ou les groupes Facebook dédiés. La demande est forte entre juin et septembre, préparez un dossier complet avec garants (physique ou Visale).`,
        loyers: [
          { type: "Studio", price_range: "400 - 600€" },
          { type: "T2", price_range: "550 - 800€" },
        ],
      },
      loisirs: {
        text: 'Lille est réputée pour sa <span style="font-weight: bold;color:#0063cb">vie étudiante exceptionnellement animée</span>, portée par plus de 120 000 étudiants et un esprit festif légendaire.<ul><li><span style="font-weight: bold;color:#0063cb">La vie nocturne</span> se concentre autour de la rue Solférino, de la rue Masséna et de la place du Général-de-Gaulle, avec des dizaines de bars, pubs et clubs à prix abordables, et une tradition de sorties entre alternants très forte toute la semaine.</li><li>Côté culture, la ville abrite <span style="font-weight: bold;color:#0063cb">le Palais des Beaux-Arts</span>, deuxième musée de France après le Louvre, le LaM à Villeneuve-d\'Ascq dédié à l\'art moderne, ainsi que la Piscine de Roubaix, musée installé dans une ancienne piscine Art déco.</li><li><span style="font-weight: bold;color:#0063cb">La scène musicale</span> est très dynamique avec l\'Aéronef, le Splendid, le Zénith ou encore le festival Main Square qui attire chaque été plus de 100 000 personnes.</li><li>Les amateurs de balades profitent du <span style="font-weight: bold;color:#0063cb">parc de la Citadelle</span> dessiné par Vauban, du Jardin Vauban et des bords de la Deûle réaménagés pour courir, pédaler ou pique-niquer.</li><li>Côté sport, le <span style="font-weight: bold;color:#0063cb">LOSC</span> fait vibrer le stade Pierre-Mauroy avec des places à tarif étudiant, et de nombreux clubs et salles de sport proposent des abonnements adaptés aux alternants.</li><li>Enfin, impossible de parler de Lille sans évoquer <span style="font-weight: bold;color:#0063cb">la Braderie de Lille</span> début septembre, plus grand marché aux puces d\'Europe, et la gastronomie du Nord (carbonnade, welsh, moules-frites) à découvrir dans les estaminets typiques du Vieux-Lille.</li></ul>',
        types: [
          { label: "Vie nocturne", type: "bar" },
          { label: "Musées et expositions", type: "musee" },
          { label: "Concerts et festivals", type: "concert" },
          { label: "Promenades et parcs", type: "promenade" },
          { label: "Sport", type: "sport" },
          { label: "Gastronomie du Nord", type: "gastronomie" },
        ],
      },
    },
  },
  {
    ville: "Nice",
    cp: "06000",
    slug: "nice",
    region: "Provence-Alpes-Côte d'Azur",
    geopoint: {
      lat: 43.7101728,
      long: 7.2619532,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "capitale de la Côte d'Azur",
        text: `Nice, cinquième ville de France avec environ 340 000 habitants et plus d'un million dans sa métropole, est la capitale de la <strong>Côte d'Azur</strong>. Entre la Méditerranée et les contreforts du Mercantour, la ville bénéficie de près de 300 jours de soleil par an et d'un climat parmi les plus doux de France, ce qui en fait un cadre de vie particulièrement recherché par les jeunes en formation. Son centre historique (le Vieux-Nice), la Promenade des Anglais et la colline du Château composent une identité urbaine unique, à mi-chemin entre influences italiennes et provençales. Pour un alternant, Nice combine un marché de l'emploi dynamique porté par le tourisme, la tech et la santé, une vraie scène étudiante (près de 35 000 étudiants) et un art de vivre méditerranéen. La proximité immédiate de la technopole de <strong>Sophia Antipolis</strong>, premier parc technologique d'Europe situé à environ 20 km, démultiplie les opportunités dans le numérique, l'ingénierie et l'innovation. La ville est aussi très bien connectée, avec le deuxième aéroport de France et une gare reliée à Marseille, Paris et l'Italie, ce qui facilite les allers-retours en famille ou les week-ends hors de la région.`,
        image: "nice.png",
      },
      vie: {
        text: `Nice et sa métropole constituent <span style="font-weight: bold;color:#0063cb">l'un des bassins économiques les plus dynamiques du sud de la France</span>, avec plus de 70 000 entreprises réparties entre la ville, la plaine du Var et la technopole de Sophia Antipolis.<ul><li><span style="font-weight: bold;color:#0063cb">Le tourisme et l'hôtellerie-restauration</span> représentent une part majeure de l'activité locale : la Côte d'Azur accueille chaque année plus de 11 millions de visiteurs, générant de très nombreuses opportunités d'alternance dans l'hôtellerie (Groupe Barrière, AccorHotels), la restauration, l'événementiel et les agences de voyage.</li><li><span style="font-weight: bold;color:#0063cb">Le numérique et la tech</span> sont en pleine expansion, portés par Sophia Antipolis et ses plus de 2 500 entreprises (Amadeus, IBM, ARM, SAP) ainsi que par l'écosystème French Tech Côte d'Azur, très actif autour de la plaine du Var et du quartier d'Éco-Vallée.</li><li><span style="font-weight: bold;color:#0063cb">La santé et les biotechnologies</span> s'appuient sur le CHU de Nice, l'Institut universitaire de la face et du cou, et un tissu de laboratoires et start-ups regroupés notamment sur le pôle Nice Méridia.</li><li><span style="font-weight: bold;color:#0063cb">La finance, la banque-assurance et les services aux entreprises</span> (Société Générale, BNP Paribas, Thales, Orange Business) recrutent régulièrement dans le tertiaire, en particulier sur l'Arenas, près de l'aéroport.</li><li><span style="font-weight: bold;color:#0063cb">Le commerce, le BTP et l'économie de la mer</span> (yachting, ports de plaisance, maintenance navale) complètent un tissu économique varié, propice à l'alternance.</li></ul>Pour les alternants, les opportunités sont nombreuses et diversifiées : la CCI Nice Côte d'Azur, la Team Côte d'Azur et les pôles de compétitivité organisent régulièrement des forums et bourses d'alternance qui facilitent la mise en relation avec les entreprises.`,
        activites: [],
      },
      mobilite: {
        text: `Se déplacer à Nice en tant qu'alternant est plutôt pratique grâce au réseau <span style="font-weight: bold;color:#0063cb">Lignes d'Azur</span>, qui couvre la ville et la métropole avec 3 lignes de tramway et plus de 100 lignes de bus urbaines et interurbaines.<br /><br />La ligne 1 du tramway relie le nord au sud-est en passant par le centre (Jean Médecin, Garibaldi, Vauban), la ligne 2 traverse la ville d'est en ouest jusqu'à l'aéroport, et la ligne 3 dessert la plaine du Var et les zones d'activité de l'Éco-Vallée. <span style="font-weight: bold;color:#0063cb">L'abonnement mensuel jeune Lignes d'Azur coûte environ 30€/mois pour les moins de 26 ans</span> et donne accès à l'ensemble du réseau tramway + bus.<br /><br /><span style="font-weight: bold;color:#0063cb">Le vélo se développe fortement avec le service Vélo Bleu</span> (plus de 175 stations et des vélos électriques en libre-service) et plus de 180 km de pistes cyclables, notamment le long de la Promenade des Anglais et du Paillon. Les trottinettes en libre-service sont également très présentes sur le littoral.<br /><br />La gare de <span style="font-weight: bold;color:#0063cb">Nice-Ville</span> permet de rejoindre Marseille en 2h30, Paris en environ 5h40 en TGV direct, ainsi que Monaco, Menton et l'Italie (Vintimille, Gênes) en TER. <span style="font-weight: bold;color:#0063cb">L'aéroport Nice Côte d'Azur, deuxième de France</span>, relie la ville à plus de 100 destinations, un vrai plus pour les alternants qui voyagent entre Nice et leur école ou leur famille.<br /><br />La voiture reste utile pour rejoindre certains quartiers périphériques ou Sophia Antipolis, mais attention au stationnement payant dans le centre et aux ralentissements sur la Promenade des Anglais et l'A8 aux heures de pointe.`,
        transports: [
          { label: "3 lignes de tramway", type: "tramway" },
          { label: "Réseau Lignes d'Azur", type: "bus" },
          { label: "Vélo Bleu", type: "velo" },
          { label: "Trottinettes en libre-service", type: "trottinette" },
          { label: "TER et TGV (gare Nice-Ville)", type: "tgv" },
          { label: "Aéroport Nice Côte d'Azur", type: "aeroport" },
        ],
      },
      logement: {
        text: `Le marché du logement à Nice est <span style="font-weight: bold;color:#0063cb">tendu, avec des niveaux de loyers proches de ceux de Lyon ou Bordeaux</span>, la pression touristique et le nombre important de locations saisonnières limitant l'offre disponible pour les alternants.<br /><br /><span style="font-weight: bold;color:#0063cb">Pour un studio, comptez entre 500€ et 700€ par mois</span>, et entre 700€ et 1000€ pour un T2, selon le quartier et l'état du bien. Les quartiers les plus prisés par les alternants et étudiants sont :<ul><li><span style="font-weight: bold;color:#0063cb">Libération et Gare du Sud</span>, très bien desservis par le tramway, proches du centre et encore relativement accessibles.</li><li><span style="font-weight: bold;color:#0063cb">Le Port et Riquier</span>, en pleine réhabilitation, appréciés pour leur ambiance animée et leurs loyers souvent plus modérés que le Carré d'Or.</li><li><span style="font-weight: bold;color:#0063cb">Saint-Roch et Saint-Isidore</span>, proches des zones d'activité de l'est et de la plaine du Var, pratiques pour les alternants travaillant vers l'aéroport ou Nice Méridia.</li><li><span style="font-weight: bold;color:#0063cb">Le Vieux-Nice et le Carré d'Or</span>, plus chers, à privilégier en colocation pour contenir le budget.</li></ul>Les résidences du CROUS (notamment sur le campus de Valrose, Saint-Jean-d'Angély et Trotabas) proposent des chambres et studios à partir de 280€, mais les places sont très demandées et nécessitent une candidature précoce via le dossier social étudiant. Plusieurs résidences privées (Studéa, Nexity Studéa, Cardinal Campus) offrent des studios meublés avec services à partir d'environ 550€, pratiques quand on arrive d'une autre région. Rendez-vous également sur ${MON_LOGEMENT_ETUDIANT_LINK}, un service public ayant pour objectif de faciliter l'accès au logement étudiant pour découvrir plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France.<br /><br /><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches dès avril-mai</span> pour une rentrée en septembre, en combinant plateformes classiques (Leboncoin, SeLoger) et groupes Facebook dédiés au logement étudiant niçois. Les APL peuvent réduire significativement votre loyer : pensez à faire votre demande sur le site de la CAF dès votre installation, et préparez un dossier solide avec garant (Visale notamment) pour rassurer les propriétaires.`,
        loyers: [
          { type: "Studio", price_range: "500 - 700€" },
          { type: "T2", price_range: "700 - 1000€" },
        ],
      },
      loisirs: {
        text: `Nice offre un cadre de vie particulièrement propice aux loisirs entre littoral, arrière-pays et patrimoine culturel, avec des activités accessibles toute l'année grâce à son climat.<ul><li><span style="font-weight: bold;color:#0063cb">Les 7 km de Promenade des Anglais</span> sont le spot incontournable pour courir, faire du vélo ou se retrouver entre amis après le travail, avec le littoral accessible à pied depuis le centre.</li><li><span style="font-weight: bold;color:#0063cb">La scène culturelle est riche</span> avec le MAMAC, le musée Matisse, le musée Marc Chagall, l'Opéra de Nice, le théâtre national et la Villa Arson, qui proposent une programmation régulière à tarif étudiant.</li><li><span style="font-weight: bold;color:#0063cb">Les grands rendez-vous niçois</span> rythment l'année : le Carnaval de Nice, le Nice Jazz Festival, Crossover Festival et les marchés du Cours Saleya.</li><li><span style="font-weight: bold;color:#0063cb">La vie nocturne se concentre dans le Vieux-Nice et sur le port</span>, avec des bars étudiants abordables (rue Droite, place Rossetti) et plusieurs salles de concert en bord de mer.</li><li><span style="font-weight: bold;color:#0063cb">Les activités sportives sont nombreuses</span> : l'OGC Nice à l'Allianz Riviera, l'escalade, la voile, la plongée, le VTT dans l'arrière-pays, et de multiples clubs universitaires ouverts aux alternants.</li><li><span style="font-weight: bold;color:#0063cb">La montagne à portée de week-end</span> : les stations d'Isola 2000, Auron et Valberg sont à environ 1h30 pour skier l'hiver et randonner l'été.</li></ul>`,
        types: [
          { label: "Plages et littoral", type: "beach" },
          { label: "Promenade des Anglais", type: "promenade" },
          { label: "Musées et expositions", type: "musee" },
          { label: "Vie nocturne du Vieux-Nice", type: "bar" },
          { label: "Activités sportives", type: "sport" },
          { label: "Stations de ski à 1h30", type: "ski" },
        ],
      },
    },
  },
  {
    ville: "Annecy",
    slug: "annecy",
    cp: "74000",
    region: "Auvergne-Rhône-Alpes",
    geopoint: { lat: 45.8992, long: 6.1294 },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "la Venise des Alpes",
        text: `Annecy, souvent surnommée la <span style="font-weight: bold;color:#0063cb">"Venise des Alpes"</span>, est une ville d'environ 130 000 habitants (près de 220 000 à l'échelle du Grand Annecy) située en Haute-Savoie, au bord de l'un des lacs les plus purs d'Europe et au pied des massifs des Bauges et des Aravis. À mi-chemin entre Lyon et Genève, la ville combine un patrimoine médiéval remarquable (le Palais de l'Isle, la vieille ville aux canaux, le château), un cadre naturel exceptionnel et un tissu économique particulièrement dynamique tourné vers l'industrie de précision, le tourisme et le numérique. Pour un alternant, Annecy offre un équilibre de vie rare : un centre-ville à taille humaine qui se parcourt à pied, un lac baignable accessible en vélo depuis les bureaux, et un bassin d'emploi stimulé par la proximité de la Suisse et de la vallée de l'Arve. La ville accueille environ <span style="font-weight: bold;color:#0063cb">10 000 étudiants</span> via l'Université Savoie Mont-Blanc (campus IUT d'Annecy-le-Vieux), l'ESAAA, Polytech Annecy-Chambéry et plusieurs écoles de commerce et d'animation. Le taux de chômage local, parmi les plus bas de France (autour de 5 %), traduit un marché de l'emploi tendu mais extrêmement porteur pour les jeunes en alternance.`,
        image: "annecy.png",
      },
      vie: {
        text: `<span style="font-weight: bold;color:#0063cb">Annecy s'appuie sur un tissu économique diversifié et très industriel</span>, adossé à l'un des plus grands bassins de sous-traitance industrielle de France. Les alternants y trouvent des opportunités dans plusieurs filières de premier plan :<ul><li><span style="font-weight: bold;color:#0063cb">Industrie de précision, mécatronique et décolletage</span> — avec la proximité immédiate de la vallée de l'Arve (premier bassin mondial du décolletage) et des entreprises comme NTN-SNR, Stäubli, Thésame, Somfy (à Cluses) ou Bontaz.</li><li><span style="font-weight: bold;color:#0063cb">Sports outdoor et équipement de montagne</span> — la région abrite des marques emblématiques comme Salomon, Fusalp, Rossignol ou Dynastar et un écosystème solide de start-ups liées à la montagne.</li><li><span style="font-weight: bold;color:#0063cb">Cinéma d'animation et industries créatives</span> — Annecy est la capitale mondiale du film d'animation (Festival international du film d'animation, CITIA, Gobelins) avec des studios comme TeamTO, Folimage ou Cube.</li><li><span style="font-weight: bold;color:#0063cb">Numérique, services et conseil</span> — présence de Sopra Steria, Blue Frog Robotics, Sogelink, ainsi que de nombreuses ESN et agences digitales.</li><li><span style="font-weight: bold;color:#0063cb">Tourisme, hôtellerie-restauration et banque</span> — l'économie touristique (plus de 2 millions de visiteurs par an) structure un maillage dense d'emplois, complété par les sièges régionaux de la Banque Laydernier et du Crédit Agricole des Savoie.</li></ul>Ce maillage, combiné à la proximité de la Suisse (bassin genevois à moins d'une heure), offre aux alternants un marché particulièrement ouvert et des perspectives d'embauche très favorables à l'issue du contrat.`,
        activites: [],
      },
      mobilite: {
        text: `Se déplacer à Annecy est à la fois simple et agréable grâce à <span style="font-weight: bold;color:#0063cb">un réseau de bus urbain dense et une infrastructure cyclable exceptionnelle</span>. Le réseau Sibra exploite une trentaine de lignes qui desservent l'ensemble de l'agglomération (Annecy-le-Vieux, Seynod, Cran-Gevrier, Meythet, Pringy) avec des fréquences renforcées aux heures de pointe.<br /><br /><span style="font-weight: bold;color:#0063cb">L'abonnement jeune (moins de 26 ans) coûte environ 25 € par mois</span>, et il existe un tarif alternant/étudiant encore plus avantageux via les aides du Grand Annecy. La ville ne dispose ni de métro ni de tramway, mais des lignes de bus à haut niveau de service (lignes 1, 4 et 6) relient rapidement le centre aux zones d'activités.<br /><br /><span style="font-weight: bold;color:#0063cb">Annecy est aussi une ville vélo par excellence</span> : la Voie Verte du lac d'Annecy (plus de 42 km le long du lac jusqu'à Doussard) et plus de 100 km de pistes cyclables dans l'agglomération permettent de relier la plupart des entreprises sans voiture. Le service Vélonecy propose des locations longue durée de vélos classiques ou à assistance électrique à partir de <span style="font-weight: bold;color:#0063cb">15 € par mois pour les jeunes</span>.<br /><br />Le centre historique est <span style="font-weight: bold;color:#0063cb">entièrement piéton et se traverse en 15 minutes</span> à pied. Côté longue distance, la gare SNCF relie Lyon en 1h50, Paris en 3h45 en TGV direct et Genève en 45 minutes. L'aéroport international de Genève, à 40 km, offre des liaisons mondiales, complété par le petit aéroport d'Annecy-Meythet pour les vols régionaux.<br /><br />En hiver, <span style="font-weight: bold;color:#0063cb">des navettes « Skibus » relient directement Annecy aux stations de La Clusaz, du Grand-Bornand ou du Semnoz</span>, de quoi profiter des Alpes sans voiture personnelle.`,
        transports: [
          { label: "Bus Sibra", type: "bus" },
          { label: "Voie Verte et pistes cyclables", type: "velo" },
          { label: "Vélonecy (VAE en libre-service)", type: "velo" },
          { label: "Centre historique piéton", type: "pieton" },
          { label: "Gare SNCF (TGV Paris & Lyon)", type: "tgv" },
          { label: "Aéroport de Genève à 40 km", type: "aeroport" },
        ],
      },
      logement: {
        text: `Le marché du logement à Annecy est <span style="font-weight: bold;color:#0063cb">l'un des plus tendus de France</span> en raison de la pression touristique et de la proximité du bassin genevois. Pour un studio, comptez entre <span style="font-weight: bold;color:#0063cb">500 et 700 €</span> charges comprises selon le quartier, et entre <span style="font-weight: bold;color:#0063cb">700 et 950 €</span> pour un T2, avec des écarts marqués entre centre-ville et périphérie.<ul><li><span style="font-weight: bold;color:#0063cb">Annecy-le-Vieux</span> concentre une grande partie des résidences étudiantes et des logements adaptés aux alternants, à proximité directe du campus IUT et bien desservi par le bus.</li><li><span style="font-weight: bold;color:#0063cb">Novel, Les Fins et Les Romains</span> offrent un bon compromis entre loyers raisonnables, proximité du centre et accès rapide aux zones d'activités.</li><li><span style="font-weight: bold;color:#0063cb">Cran-Gevrier, Meythet et Seynod</span> (communes intégrées au Grand Annecy) proposent des loyers plus abordables (-50 à -100 €) tout en restant bien connectées par le réseau Sibra.</li><li>Le <span style="font-weight: bold;color:#0063cb">centre-ville historique (Vieille Ville, Bonlieu)</span> est très prisé mais plus cher et souvent loué en saisonnier l'été.</li></ul><span style="font-weight: bold;color:#0063cb">Il est vivement recommandé de commencer ses recherches au moins trois mois avant la rentrée</span> : la demande explose en juin-juillet et beaucoup de biens partent en 48 heures. Les résidences CROUS (sur le campus d'Annecy-le-Vieux) proposent des logements à partir de 320 €, mais les places sont limitées — candidature via le dossier social étudiant dès janvier. Les résidences étudiantes privées (Studéa, Nexity Studéa, Cardinal Campus) offrent une alternative meublée avec services à partir de 550 €. ${MON_LOGEMENT_ETUDIANT_LINK} est un service public ayant pour objectif de faciliter l'accès au logement étudiant et référence plus de 300 résidences sociales (soit près de 40 000 logements) sur toute la France.<br /><br /><span style="font-weight: bold;color:#0063cb">N'oubliez pas de solliciter les APL</span> dès votre entrée dans le logement : l'aide peut atteindre 100 à 200 € par mois pour un salaire d'alternant. Certains employeurs haut-savoyards proposent également une aide logement dans le cadre du contrat d'alternance (Action Logement, Mobili-Jeune jusqu'à 100 €/mois). Pensez à préparer un dossier solide avec garants (ou à recourir à la garantie Visale, gratuite pour les moins de 30 ans).`,
        loyers: [
          { type: "Studio", price_range: "500 - 700€" },
          { type: "T2", price_range: "700 - 950€" },
        ],
      },
      loisirs: {
        text: `Annecy offre <span style="font-weight: bold;color:#0063cb">un cadre de vie exceptionnel pour les alternants</span>, à la croisée du lac, de la montagne et d'une vie culturelle dense pour une ville de cette taille.<ul><li><span style="font-weight: bold;color:#0063cb">Le lac d'Annecy</span> est un véritable atout au quotidien : baignade gratuite dans les plages du Pâquier, de l'Impérial ou d'Albigny, paddle, voile, plongée et simples pique-niques après le travail. La Voie Verte qui en fait le tour (42 km) est idéale pour courir, rouler ou patiner.</li><li><span style="font-weight: bold;color:#0063cb">La montagne à moins de 30 minutes</span> — ski et snowboard au Semnoz, à La Clusaz ou au Grand-Bornand l'hiver ; randonnée, parapente (la Forclaz), VTT, escalade et via ferrata l'été. Les forfaits jeunes rendent les sports d'hiver accessibles à partir de 20 €/jour.</li><li><span style="font-weight: bold;color:#0063cb">Une scène culturelle surdimensionnée</span> : le Festival international du film d'animation (référence mondiale chaque mois de juin), Bonlieu Scène Nationale, le Brise Glace (salle de musiques actuelles), le cinéma d'art et essai Novel ainsi que les nombreux festivals estivaux (Fêtes du Lac, Noctibules, Annecy Paysages).</li><li><span style="font-weight: bold;color:#0063cb">Bars et vie nocturne concentrés</span> autour de la vieille ville, du quai de l'Île et de la rue Sainte-Claire, avec une ambiance étudiante animée pendant l'année universitaire.</li><li><span style="font-weight: bold;color:#0063cb">Gastronomie savoyarde et marchés</span> — raclette, fondue, tartiflette, fromages AOP, ainsi que le marché du mardi et du vendredi dans la vieille ville, réputés dans toute la région.</li><li><span style="font-weight: bold;color:#0063cb">Infrastructures sportives complètes</span> : stade des Marquisats, piscine Jean-Régis, salles d'escalade (Vertical'Art), clubs d'aviron et de voile sur le lac.</li></ul>Le week-end, Genève, Lyon, Chamonix et les lacs italiens sont accessibles en quelques heures — un terrain de jeu difficile à égaler pour un jeune alternant.`,
        types: [
          { label: "Lac et plages", type: "beach" },
          { label: "Passion montagne et ski", type: "ski" },
          { label: "Festival d'animation et culture", type: "cinema" },
          { label: "Bars et vie nocturne", type: "bar" },
          { label: "Gastronomie savoyarde", type: "gastronomie" },
          { label: "Sport outdoor", type: "sport" },
        ],
      },
    },
  },
  {
    ville: "Reims",
    cp: "51100",
    slug: "reims",
    region: "Grand Est",
    geopoint: {
      lat: 49.258329,
      long: 4.031696,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "capitale du Champagne",
        text: "Reims, plus grande ville de la Marne avec près de 180 000 habitants (environ 320 000 dans la communauté urbaine du Grand Reims), est une destination de choix pour les alternants. Située à seulement 45 minutes de Paris en TGV, la cité des sacres bénéficie d'une position stratégique au cœur du Grand Est, aux portes de la Belgique. Son patrimoine exceptionnel, avec la cathédrale Notre-Dame classée au patrimoine mondial de l'UNESCO où furent sacrés 25 rois de France, côtoie un dynamisme économique porté par de grandes maisons de luxe, l'agroalimentaire et une diversification industrielle réussie. Avec plus de 30 000 étudiants, dont une part significative inscrite à l'Université de Reims Champagne-Ardenne (URCA) et à NEOMA Business School, la ville offre une atmosphère jeune et conviviale. Pour un alternant, Reims combine un coût de la vie raisonnable, des opportunités professionnelles variées et une qualité de vie appréciable. L'ambiance y est chaleureuse, moins tendue qu'à Paris, tout en gardant un rythme dynamique grâce à un tissu économique en pleine modernisation.",
        image: "reims.png",
      },
      vie: {
        text: 'Reims dispose d\'un tissu économique diversifié qui offre de belles perspectives aux alternants dans des secteurs variés.<ul><li><span style="font-weight: bold;color:#0063cb">Les maisons de luxe et de prestige</span> (Veuve Clicquot, Taittinger, Pommery, G.H. Mumm, Ruinart) recrutent régulièrement des alternants en commerce international, marketing, supply chain, finance et production, avec une forte dimension export.</li><li><span style="font-weight: bold;color:#0063cb">Le secteur agroalimentaire et biosourcé</span> est particulièrement porteur grâce au pôle de compétitivité Bioeconomy For Change et à la présence d\'acteurs majeurs comme Cristal Union, Chamtor ou ARD, offrant des opportunités autour de la chimie verte et de la bioraffinerie.</li><li><span style="font-weight: bold;color:#0063cb">La logistique et la supply chain</span> s\'appuient sur la position stratégique de Reims, à la croisée de plusieurs autoroutes et proche de l\'aéroport de Paris-Vatry, avec de nombreux entrepôts et plateformes qui recrutent.</li><li>La ville accueille également <span style="font-weight: bold;color:#0063cb">un écosystème numérique en croissance</span>, soutenu par la French Tech Est et des espaces comme le Village by CA ou Innovact, où startups et PME innovantes proposent des alternances en développement, data et marketing digital.</li><li><span style="font-weight: bold;color:#0063cb">La santé avec le CHU de Reims</span>, l\'enseignement supérieur (URCA, NEOMA, Sciences Po Campus de Reims) et les services aux entreprises (banque, assurance, conseil) complètent un marché du travail dynamique.</li></ul><span style="font-weight: bold;color:#0063cb">Avec un taux de chômage proche de la moyenne nationale</span>, Reims offre un marché de l\'alternance porteur, notamment dans le commerce, la communication, la supply chain et le digital.',
        activites: [],
      },
      mobilite: {
        text: "<span style=\"font-weight: bold;color:#0063cb\">Se déplacer à Reims est simple et économique</span> grâce au réseau Citura qui dessert toute l'agglomération. Le réseau comprend <span style=\"font-weight: bold;color:#0063cb\">2 lignes de tramway (A et B)</span> qui relient efficacement les principaux pôles de la ville, du quartier Orgeval à la gare centrale en passant par le centre historique, avec des passages toutes les 5 à 10 minutes en heure de pointe. Plus de 20 lignes de bus complètent le maillage et permettent de rejoindre les zones d'activité périphériques comme Farman, Bezannes ou la Neuvillette.<br /><br />L'abonnement mensuel jeune (moins de 25 ans) coûte environ 27 euros, l'un des tarifs les plus avantageux de France pour un alternant. La ville développe aussi <span style=\"font-weight: bold;color:#0063cb\">la pratique du vélo avec près de 200 km de pistes et bandes cyclables</span> et le service de vélos en libre-service Zébullo, disponible à partir d'un abonnement très abordable.<br /><br />Le centre-ville, largement piétonnier autour de la place Drouet-d'Erlon et du parvis de la cathédrale, est facile à parcourir à pied. <span style=\"font-weight: bold;color:#0063cb\">La gare de Reims Centre permet de rejoindre Paris en 45 minutes</span> grâce au TGV, ce qui facilite les déplacements professionnels ou les week-ends en famille. La gare de Champagne-Ardenne TGV, située à Bezannes, est accessible en tramway et dessert aussi Strasbourg, Lille ou Bordeaux. L'aéroport de Paris-Vatry, à 45 minutes en voiture, complète l'offre pour les vols low-cost.",
        transports: [
          { label: "Tramway (2 lignes)", type: "tramway" },
          { label: "Bus Citura", type: "bus" },
          { label: "Zébullo", type: "velo" },
          { label: "Centre ville piétonnier", type: "pieton" },
          { label: "TGV Paris en 45 min", type: "tgv" },
          { label: "Aéroport Paris-Vatry", type: "aeroport" },
        ],
      },
      logement: {
        text: `Trouver un logement à Reims reste accessible financièrement pour les alternants, avec un marché moins tendu que dans les grandes métropoles. <span style="font-weight: bold;color:#0063cb">Pour un studio, comptez entre 400 et 550 euros</span> charges comprises selon le quartier et l'état du bien, tandis qu'un T2 se situe généralement entre 550 et 750 euros.<ul><li>Les quartiers les plus prisés par les étudiants et alternants sont <span style="font-weight: bold;color:#0063cb">Jean Jaurès, Clairmarais et Boulingrin</span>, proches du centre et de la gare, avec une ambiance jeune et de nombreux commerces.</li><li><span style="font-weight: bold;color:#0063cb">Le centre-ville autour de la place Drouet-d'Erlon</span> est très recherché pour sa vie nocturne et ses services, mais les loyers y sont légèrement plus élevés.</li><li><span style="font-weight: bold;color:#0063cb">Courlancy et Saint-Rémi</span> offrent un bon compromis entre calme résidentiel et proximité des transports, tandis que Croix-Rouge et Murigny proposent des loyers plus abordables et de nombreuses résidences étudiantes près du campus universitaire.</li></ul><span style="font-weight: bold;color:#0063cb">Les résidences du CROUS proposent des logements à partir de 250 euros</span>, mais les places sont limitées et la demande forte dès l'été. Des résidences étudiantes privées (Studéa, Nemea, Cardinal Campus) complètent l'offre avec des studios meublés et services inclus. ${MON_LOGEMENT_ETUDIANT_LINK} est un service public ayant pour objectif de faciliter l'accès au logement étudiant et référence plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches au moins deux mois avant la rentrée</span> sur les plateformes classiques (Leboncoin, PAP, SeLoger) et les groupes Facebook dédiés au logement étudiant à Reims. <span style="font-weight: bold;color:#0063cb">N'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer mensuel</span>, et pensez à la garantie Visale gratuite d'Action Logement si vous n'avez pas de garant. Certains employeurs proposent aussi une aide au logement dans le cadre du contrat d'alternance.`,
        loyers: [
          { type: "Studio", price_range: "400 - 550€" },
          { type: "T2", price_range: "550 - 750€" },
        ],
      },
      loisirs: {
        text: 'Reims offre une vie culturelle et festive surprenante pour une ville de sa taille, qui saura séduire les alternants en quête d\'équilibre entre travail et détente.<ul><li><span style="font-weight: bold;color:#0063cb">La place Drouet-d\'Erlon</span>, artère piétonne emblématique, concentre l\'essentiel des bars, brasseries et restaurants où se retrouve la jeunesse rémoise, avec une ambiance particulièrement animée le jeudi soir, jour traditionnel de sortie étudiante.</li><li><span style="font-weight: bold;color:#0063cb">La cathédrale Notre-Dame et le Palais du Tau</span>, classés au patrimoine mondial de l\'UNESCO, offrent un décor exceptionnel pour des balades culturelles, complétés par le musée des Beaux-Arts et le FRAC Champagne-Ardenne.</li><li><span style="font-weight: bold;color:#0063cb">Les festivals rythment l\'année</span> avec les Flâneries Musicales de Reims (musique classique), Magnifique Society (pop-rock au Parc de Champagne), Reims Jazz Festival ou le Reims Polar pour les amateurs de roman noir.</li><li>Côté scène musicale, <span style="font-weight: bold;color:#0063cb">La Cartonnerie (SMAC) et l\'Opéra de Reims</span> programment des concerts toute l\'année à des tarifs accessibles, tandis que le cinéma Opéraims et le Gaumont satisfont les cinéphiles.</li><li><span style="font-weight: bold;color:#0063cb">Les sportifs profitent du Stade Auguste-Delaune</span> (mythique Stade de Reims en football), de nombreuses salles de sport, du parc de Champagne pour courir, et peuvent même s\'évader en forêt de la Montagne de Reims pour des randonnées à 20 minutes du centre.</li></ul>',
        types: [
          { label: "Place Drouet-d'Erlon", type: "bar" },
          { label: "Cathédrale et musées", type: "musee" },
          { label: "Parcs et randonnée", type: "promenade" },
          { label: "Festivals", type: "musique" },
          { label: "Concerts et opéra", type: "concert" },
          { label: "Sport", type: "sport" },
        ],
      },
    },
  },
  {
    ville: "Rouen",
    cp: "76000",
    slug: "rouen",
    region: "Normandie",
    geopoint: {
      lat: 49.443232,
      long: 1.099971,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "capitale historique de la Normandie",
        text: "Rouen, préfecture de la Seine-Maritime et capitale historique de la Normandie, est une ville de près de 115 000 habitants (près de 500 000 dans la métropole Rouen Normandie) qui séduit de plus en plus d'alternants. Surnommée la &quot;ville aux cent clochers&quot;, Rouen offre un patrimoine médiéval exceptionnel avec sa cathédrale Notre-Dame immortalisée par Monet, ses maisons à colombages et le Gros-Horloge emblématique du centre piéton. À seulement 1h10 de Paris en train, la ville combine l'atmosphère d'une métropole régionale dynamique avec un coût de la vie bien plus accessible que la capitale. Rouen accueille plus de <strong>45 000 étudiants</strong>, ce qui crée une ambiance jeune et animée dans les quartiers centraux et sur les campus de Mont-Saint-Aignan. Pour un alternant, Rouen représente un excellent compromis : proximité de Paris, tissu économique diversifié porté par la vallée de la Seine, vie étudiante active et qualité de vie préservée. Son cadre verdoyant, les bords de Seine réaménagés et la proximité de la côte normande (Étretat, Deauville à moins d'une heure) ajoutent un charme supplémentaire à cette destination idéale pour débuter sa carrière professionnelle.",
        image: "rouen.png",
      },
      vie: {
        text: 'Le tissu économique de la métropole rouennaise est <span style="font-weight: bold;color:#0063cb">particulièrement diversifié et tourné vers l\'industrie</span>, offrant de nombreuses opportunités aux alternants. <ul><li><span style="font-weight: bold;color:#0063cb">L\'industrie pharmaceutique et chimique</span> constitue un pilier historique avec Sanofi, Aptar Pharma, Janssen et de nombreux laboratoires qui recrutent régulièrement en production, qualité et R&amp;D.</li><li><span style="font-weight: bold;color:#0063cb">La logistique et le secteur portuaire</span> sont particulièrement dynamiques grâce au port de Rouen, premier port céréalier d\'Europe occidentale, et à la position stratégique sur l\'axe Seine entre Paris et Le Havre.</li><li><span style="font-weight: bold;color:#0063cb">L\'automobile</span> reste bien représentée avec Renault Cléon (sites des moteurs et boîtes de vitesses) et un écosystème de sous-traitants de rang 1 et 2.</li><li><span style="font-weight: bold;color:#0063cb">Le numérique et la French Tech Normandy</span> se développent fortement, notamment autour de l\'écosystème Seine Innopolis à Petit-Quevilly qui héberge startups, PME et centres d\'innovation.</li><li>Les secteurs de la <span style="font-weight: bold;color:#0063cb">banque-assurance (Matmut, MAAF, CIC)</span>, de la santé avec le CHU de Rouen et du commerce complètent ce panorama économique. </li></ul><span style="font-weight: bold;color:#0063cb">Avec un bassin d\'emploi de plus de 200 000 postes</span>, Rouen offre aux alternants un marché accessible où la concurrence est moins féroce qu\'en région parisienne, pour un éventail de formations très large.',
        activites: [],
      },
      mobilite: {
        text: '<span style="font-weight: bold;color:#0063cb">Se déplacer à Rouen est simple et abordable</span> grâce au réseau Astuce (TCAR) qui dessert l\'ensemble de la métropole. Le réseau est structuré autour du métro (une ligne semi-enterrée qui relie Boulingrin au nord à Technopôle / Georges Braque au sud) complété par <span style="font-weight: bold;color:#0063cb">deux lignes de TEOR (bus à haut niveau de service)</span> et plus de 30 lignes de bus classiques qui maillent efficacement l\'agglomération et les communes voisines comme Sotteville, Grand-Quevilly ou Mont-Saint-Aignan.<br /><br /><span style="font-weight: bold;color:#0063cb">L\'abonnement mensuel jeune (-26 ans) coûte environ 32 euros</span>, un tarif très avantageux pour les alternants qui bénéficient en plus d\'une prise en charge à 50% par leur employeur. Le service Lovélo Libre-Service propose plus de 450 vélos en libre-service dans 45 stations <span style="font-weight: bold;color:#0063cb">à partir de 25 euros par an</span>, et le réseau cyclable de la métropole s\'étend sur près de 180 km, avec des pistes sécurisées le long de la Seine.<br /><br /><span style="font-weight: bold;color:#0063cb">La gare Rouen Rive-Droite</span> permet de rejoindre Paris Saint-Lazare en 1h10 avec des trains fréquents, idéal pour les alternants qui gardent un pied dans la capitale, ainsi que Le Havre, Caen ou Amiens en moins de 1h30. Rouen est également reliée aux grandes villes françaises via les autoroutes A13, A28 et A29.',
        transports: [
          { label: "Métro Astuce", type: "metro" },
          { label: "TEOR et bus", type: "bus" },
          { label: "Lovélo Libre-Service", type: "velo" },
          { label: "180 km de pistes cyclables", type: "trottinette" },
          { label: "Centre historique piéton", type: "pieton" },
          { label: "Gare Rouen Rive-Droite", type: "tgv" },
        ],
      },
      logement: {
        text: `Trouver un logement à Rouen <span style="font-weight: bold;color:#0063cb">reste accessible pour les alternants</span>, avec des loyers bien plus raisonnables qu'en région parisienne. Pour un studio, comptez entre 400 et 550 euros charges comprises selon le quartier et l'état du bien, tandis qu'un T2 se situe généralement entre 550 et 750 euros.<ul><li>Les quartiers les plus prisés par les étudiants et alternants sont <span style="font-weight: bold;color:#0063cb">le centre historique (Vieux-Marché, Saint-Marc, Cathédrale)</span>, animé et proche de tout, bien que les loyers y soient légèrement plus élevés.</li><li><span style="font-weight: bold;color:#0063cb">Mont-Saint-Aignan</span>, sur les hauteurs, concentre les campus universitaires et propose de nombreuses résidences étudiantes à prix accessibles.</li><li><span style="font-weight: bold;color:#0063cb">La rive gauche (Saint-Sever, Grammont)</span> offre un excellent rapport qualité-prix avec un accès direct au centre par le métro, tandis que <span style="font-weight: bold;color:#0063cb">le quartier de la Gare et des Emmurées</span> attire les alternants qui font des allers-retours sur Paris.</li></ul><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches au moins deux mois avant la rentrée</span> sur les plateformes classiques (Leboncoin, PAP, SeLoger) et les groupes Facebook dédiés au logement étudiant à Rouen. Les résidences CROUS proposent des logements entre 250 et 400 euros, mais la demande est forte. ${MON_LOGEMENT_ETUDIANT_LINK} est un service public ayant pour objectif de faciliter l'accès au logement étudiant et référence plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style="font-weight: bold;color:#0063cb">N'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer mensuel</span>, et que la garantie Visale d'Action Logement (gratuite pour les moins de 30 ans) peut remplacer un garant physique. Certains employeurs proposent également une aide au logement dans le cadre du contrat d'alternance, pensez à vous renseigner.`,
        loyers: [
          { type: "Studio", price_range: "400 - 550€" },
          { type: "T2", price_range: "550 - 750€" },
        ],
      },
      loisirs: {
        text: 'Rouen offre une <span style="font-weight: bold;color:#0063cb">vie culturelle et festive particulièrement riche</span> qui séduira les alternants en quête d\'équilibre entre vie professionnelle et détente.<ul><li><span style="font-weight: bold;color:#0063cb">Le centre historique piétonnier</span>, avec ses maisons à colombages, la rue du Gros-Horloge et la place du Vieux-Marché, constitue un terrain de promenade unique en France, classé aux côtés de la cathédrale immortalisée par Monet.</li><li><span style="font-weight: bold;color:#0063cb">Les bords de Seine réaménagés</span>, des quais bas aux Docks 76, sont devenus le lieu de rassemblement des Rouennais, idéals pour courir, se retrouver en terrasse ou profiter des food-trucks du week-end.</li><li><span style="font-weight: bold;color:#0063cb">La vie nocturne</span> se concentre autour de la place Saint-Marc, du quartier Martainville et de la rue Cauchoise, avec de nombreux bars étudiants à budget accessible et des soirées jeudi soir emblématiques.</li><li><span style="font-weight: bold;color:#0063cb">La scène culturelle</span> est animée par l\'Opéra de Rouen, le Zénith (l\'un des plus grands de France), le 106 (scène de musiques actuelles), et de nombreux cinémas dont l\'Omnia République pour le cinéma d\'art et essai.</li><li><span style="font-weight: bold;color:#0063cb">Les musées gratuits pour les moins de 26 ans</span> (Beaux-Arts, Céramique, Secq des Tournelles) enrichissent l\'offre culturelle, tandis que l\'Armada, plus grand rassemblement de voiliers au monde, rythme les années impaires.</li><li><span style="font-weight: bold;color:#0063cb">Le sport et la nature</span> ne sont jamais loin avec les forêts domaniales de Roumare et Verte, les clubs de rugby et de hockey, et la proximité des plages normandes (Dieppe, Étretat) accessibles en moins d\'une heure.</li></ul>',
        types: [
          { label: "Centre historique", type: "promenade" },
          { label: "Musées et patrimoine", type: "musee" },
          { label: "Bords de Seine", type: "quai" },
          { label: "Vie nocturne", type: "bar" },
          { label: "Concerts et théâtre", type: "concert" },
          { label: "Sport et nature", type: "sport" },
        ],
      },
    },
  },
  {
    ville: "Tours",
    cp: "37000",
    slug: "tours",
    region: "Centre-Val de Loire",
    geopoint: {
      lat: 47.394144,
      long: 0.68484,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "cœur du Val de Loire",
        text: "Tours, préfecture d'Indre-et-Loire avec près de <strong>137 000 habitants</strong> (environ 500 000 dans l'aire urbaine), est une destination privilégiée pour les alternants qui recherchent l'équilibre entre dynamisme professionnel et qualité de vie. Située au cœur du Val de Loire classé au patrimoine mondial de l'UNESCO, la ville profite d'une position géographique stratégique, à seulement <strong>1h de Paris en TGV</strong> et à proximité des grands châteaux de la Loire. Son centre historique, avec la place Plumereau et ses maisons à pans de bois, côtoie des quartiers récents comme les Deux-Lions, illustrant la capacité de la ville à mêler patrimoine et modernité. Tours compte près de <strong>30 000 étudiants</strong> grâce à son université pluridisciplinaire, à Polytech Tours, à l'ESCEM et à plusieurs écoles supérieures, ce qui crée une ambiance jeune particulièrement visible autour de la place Plumereau et du quartier des Halles. Pour un alternant, Tours offre un coût de la vie nettement plus abordable que les grandes métropoles, un climat doux et une ville à taille humaine où l'on se déplace facilement à pied ou à vélo, tout en gardant une connexion rapide avec Paris et le reste de la France.",
        image: "tours.png",
      },
      vie: {
        text: 'Le tissu économique tourangeau est <span style="font-weight: bold;color:#0063cb">diversifié et résilient</span>, avec des filières historiques solides et des secteurs innovants en plein développement.<ul><li><span style="font-weight: bold;color:#0063cb">La santé et les sciences du vivant</span> constituent un pilier majeur autour du CHRU de Tours, l\'un des plus importants centres hospitaliers universitaires du grand Ouest, et de nombreux laboratoires de recherche associés à l\'université.</li><li><span style="font-weight: bold;color:#0063cb">La pharmacie, la cosmétique et la chimie fine</span> sont bien représentées avec des acteurs comme Delpharm, Recipharm ou encore Cosmétique Active Production (L\'Oréal) dans la région, offrant de nombreux contrats d\'alternance en production, qualité et R&D.</li><li><span style="font-weight: bold;color:#0063cb">L\'assurance et les services financiers</span> pèsent lourd dans l\'emploi tertiaire tourangeau avec les implantations de Groupama Centre-Manche, de la CNP et de plusieurs mutuelles.</li><li><span style="font-weight: bold;color:#0063cb">L\'aéronautique et la défense</span> sont portées par Daher à Saint-Pierre-des-Corps, tandis que le numérique se développe rapidement dans le quartier des Deux-Lions avec plusieurs ESN et startups regroupées au sein de la French Tech Loire Valley.</li><li>Le tourisme, le commerce, la logistique et l\'agroalimentaire complètent le panorama, offrant aux alternants un large choix de secteurs pour construire leur parcours.</li></ul><span style="font-weight: bold;color:#0063cb">Avec un taux de chômage proche de la moyenne nationale</span> et une métropole qui attire de nouveaux arrivants chaque année, Tours présente un marché de l\'alternance accessible, où les profils jeunes trouvent rapidement une entreprise d\'accueil.',
        activites: [],
      },
      mobilite: {
        text: 'Se déplacer à Tours est particulièrement simple grâce à un réseau de transports en commun bien pensé et à une ville à taille humaine, largement praticable à pied ou à vélo.<br /><br />Le réseau <span style="font-weight: bold;color:#0063cb">Fil Bleu</span>, opéré par Keolis, s\'articule autour d\'une <span style="font-weight: bold;color:#0063cb">ligne de tramway (ligne A)</span> qui relie le nord au sud de l\'agglomération en traversant le centre-ville, complétée par <span style="font-weight: bold;color:#0063cb">plus de 30 lignes de bus</span> qui desservent l\'ensemble des communes de la métropole. Une seconde ligne de tramway est en travaux pour renforcer le maillage de l\'agglomération.<br /><br /><span style="font-weight: bold;color:#0063cb">L\'abonnement mensuel jeune (moins de 26 ans) coûte environ 28 euros</span>, ce qui en fait l\'un des réseaux les plus accessibles de France pour les alternants.<br /><br />Tours est également <span style="font-weight: bold;color:#0063cb">une ville très cyclable</span>, avec plus de 220 km de pistes et bandes cyclables, un relief plat et le service de vélos en libre-service <span style="font-weight: bold;color:#0063cb">Vélociti</span>. De nombreux alternants optent pour le vélo au quotidien, y compris pour rejoindre les zones d\'activité des Deux-Lions ou de Saint-Pierre-des-Corps.<br /><br />Pour les trajets longue distance, <span style="font-weight: bold;color:#0063cb">la gare de Tours et celle de Saint-Pierre-des-Corps</span> placent Paris à 1h en TGV, Bordeaux à 2h et offrent des liaisons directes vers Nantes, Lille ou Lyon. Le centre-ville historique, largement piéton autour de la place Plumereau et des Halles, se parcourt facilement à pied pour les trajets du quotidien.',
        transports: [
          { label: "Tramway", type: "tramway" },
          { label: "Bus Fil Bleu", type: "bus" },
          { label: "Vélociti", type: "velo" },
          { label: "Pistes cyclables", type: "trottinette" },
          { label: "Gares TGV", type: "tgv" },
          { label: "Centre-ville piéton", type: "pieton" },
        ],
      },
      logement: {
        text: `Trouver un logement à Tours <span style="font-weight: bold;color:#0063cb">reste abordable</span> comparé aux grandes métropoles, même si le marché s'est tendu ces dernières années avec l'arrivée de nouveaux habitants. Pour un studio, comptez entre 400 et 550 euros charges comprises selon le quartier, tandis qu'un T2 se situe généralement entre 500 et 700 euros.<ul><li>Les quartiers les plus prisés par les étudiants et alternants sont <span style="font-weight: bold;color:#0063cb">le Vieux-Tours autour de la place Plumereau</span>, idéal pour son ambiance animée et sa proximité des Halles et de la gare.</li><li><span style="font-weight: bold;color:#0063cb">Velpeau et Beaujardin</span>, en plein centre, offrent un bon rapport qualité-prix avec des petits immeubles anciens bien desservis par le tramway.</li><li><span style="font-weight: bold;color:#0063cb">Les Deux-Lions</span>, quartier moderne au sud, attire les alternants travaillant dans le tertiaire grâce à ses résidences neuves et son accès direct au tram.</li><li><span style="font-weight: bold;color:#0063cb">Tours Nord et Saint-Pierre-des-Corps</span> proposent des loyers plus doux avec un accès rapide au centre via le tram ou le TER.</li></ul><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches au moins 2 mois avant la rentrée</span> via les plateformes classiques (Leboncoin, PAP, SeLoger) et les groupes Facebook étudiants. Les résidences CROUS et les résidences privées (Studéa, Cardinal Campus) représentent une alternative pratique autour de 450 à 600 euros pour un studio meublé. Rendez-vous sur ${MON_LOGEMENT_ETUDIANT_LINK}, un service public ayant pour objectif de faciliter l'accès au logement étudiant pour découvrir plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style="font-weight: bold;color:#0063cb">N'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer mensuel</span>, et que certains employeurs proposent une aide au logement dans le cadre du contrat d'alternance. Un dossier solide avec garant reste recommandé pour se démarquer auprès des propriétaires.`,
        loyers: [
          { type: "Studio", price_range: "400 - 550€" },
          { type: "T2", price_range: "500 - 750€" },
        ],
      },
      loisirs: {
        text: 'Tours offre une vie culturelle et festive riche, portée par une importante population étudiante et par le cadre exceptionnel du Val de Loire.<ul><li><span style="font-weight: bold;color:#0063cb">La place Plumereau et le Vieux-Tours</span> constituent le cœur de la vie nocturne, avec des dizaines de bars, brasseries et restaurants qui animent les soirées étudiantes.</li><li><span style="font-weight: bold;color:#0063cb">Les bords de Loire et du Cher</span>, récemment réaménagés, sont devenus des lieux privilégiés pour courir, pique-niquer ou se promener entre amis, notamment sur la guinguette de Tours-sur-Loire en été.</li><li><span style="font-weight: bold;color:#0063cb">La scène culturelle</span> est animée par des équipements reconnus comme le CCC OD (Centre de Création Contemporaine Olivier Debré), le musée des Beaux-Arts, le Grand Théâtre ou encore l\'Opéra de Tours, souvent accessibles à tarifs réduits pour les moins de 26 ans.</li><li><span style="font-weight: bold;color:#0063cb">Les salles de concert</span> comme le Temps Machine à Joué-lès-Tours ou le Bateau Ivre accueillent régulièrement des artistes nationaux et internationaux à des prix adaptés aux budgets étudiants.</li><li><span style="font-weight: bold;color:#0063cb">Le sport</span> est très présent avec de nombreuses infrastructures municipales, les clubs du Tours Volley-Ball et du Tours FC, et la possibilité de pratiquer l\'aviron ou le canoë sur la Loire et le Cher.</li><li><span style="font-weight: bold;color:#0063cb">Les châteaux de la Loire</span> (Chenonceau, Amboise, Villandry, Azay-le-Rideau) sont tous à moins d\'une heure et constituent des escapades idéales pour les week-ends.</li><li><span style="font-weight: bold;color:#0063cb">Les festivals</span> rythment l\'année, notamment Aucard de Tours, Terres du Son ou encore les Rendez-vous de l\'histoire.</li></ul>',
        types: [
          { label: "Vie nocturne", type: "bar" },
          { label: "Bords de Loire", type: "quai" },
          { label: "Musées", type: "musee" },
          { label: "Concerts et théâtre", type: "concert" },
          { label: "Sport", type: "sport" },
          { label: "Gastronomie", type: "gastronomie" },
        ],
      },
    },
  },
  {
    ville: "Dijon",
    cp: "21000",
    slug: "dijon",
    region: "Bourgogne-Franche-Comté",
    geopoint: {
      lat: 47.322047,
      long: 5.04148,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "capitale des Ducs de Bourgogne",
        text: "Dijon, ancienne capitale du duché de Bourgogne, est une <strong>ville à taille humaine</strong> particulièrement attractive pour les alternants. Avec près de <strong>160 000 habitants</strong> dans la commune et 260 000 dans la métropole, elle combine les avantages d'une grande ville dynamique et la qualité de vie d'une cité à échelle humaine. Son centre-ville historique, classé au patrimoine mondial de l'UNESCO, séduit par son palais des Ducs, ses hôtels particuliers et ses rues pavées. Dijon accueille environ 35 000 étudiants grâce à l'Université de Bourgogne et à de nombreuses grandes écoles (Sciences Po Dijon, BSB, ENSAM), ce qui entretient une ambiance jeune et vivante. Pour un alternant, la ville représente un excellent compromis : un marché de l'emploi diversifié porté par la santé, l'agroalimentaire et l'industrie, des loyers sensiblement plus abordables que dans les grandes métropoles, et une position centrale idéale (Paris en 1h35 en TGV, Lyon en 1h40). Le climat semi-continental et la gastronomie réputée ajoutent un charme certain à cette destination encore trop méconnue des alternants.",
        image: "dijon.png",
      },
      vie: {
        text: 'Le tissu économique dijonnais est <span style="font-weight: bold;color:#0063cb">solide et diversifié</span>, offrant de réelles opportunités aux alternants dans des secteurs porteurs.<ul><li><span style="font-weight: bold;color:#0063cb">L\'agroalimentaire et la gastronomie</span> constituent un pilier historique de l\'économie locale avec des entreprises emblématiques comme Seb, Amora-Maille, Edmond Fallot ou Mulot & Petitjean, fédérées par le pôle de compétitivité Vitagora qui rassemble plus de 300 acteurs de la filière goût-nutrition-santé.</li><li><span style="font-weight: bold;color:#0063cb">Le secteur de la santé et de la pharmacie</span> est particulièrement dynamique avec le CHU Dijon Bourgogne, le Centre Georges-François Leclerc (cancérologie) et le siège d\'Urgo, leader français du pansement, qui recrutent régulièrement des alternants.</li><li><span style="font-weight: bold;color:#0063cb">Le pôle industriel et ferroviaire</span> est bien représenté avec le Technicentre SNCF de Perrigny, Framatome ou Schneider Electric, offrant des contrats d\'alternance en maintenance, ingénierie et production.</li><li><span style="font-weight: bold;color:#0063cb">Les services et le numérique</span> se développent fortement avec l\'écosystème French Tech Dijon et des acteurs comme Orange Business Services, CGI ou les ESN locales qui recrutent en développement, data et marketing digital.</li><li>Les institutions publiques (préfecture de région, conseil régional, rectorat) et le secteur bancaire (Crédit Agricole Champagne-Bourgogne, Caisse d\'Épargne) complètent un marché de l\'alternance varié.</li></ul><span style="font-weight: bold;color:#0063cb">Avec un taux de chômage inférieur à la moyenne nationale et une métropole classée parmi les plus attractives de France</span>, Dijon offre aux alternants un tissu d\'entreprises accessible, où il est souvent plus facile de décrocher un contrat et d\'être rapidement responsabilisé.',
        activites: [],
      },
      mobilite: {
        text: '<span style="font-weight: bold;color:#0063cb">Se déplacer à Dijon est simple et peu coûteux</span> grâce au réseau Divia Mobilités, géré par Keolis, qui couvre efficacement toute la métropole. Le réseau compte 2 lignes de tramway (T1 et T2) qui desservent les principaux pôles d\'activité et campus en passant par la gare, ainsi qu\'une vingtaine de lignes de bus et des navettes gratuites dans le centre-ville (DiviaCity).<br /><br /><span style="font-weight: bold;color:#0063cb">L\'abonnement mensuel Divia Pass Jeunes est à 21,60 euros pour les moins de 26 ans</span>, l\'un des tarifs les plus compétitifs de France. Votre entreprise d\'accueil prend en charge 50% de ce montant, réduisant encore le coût réel. La ville est très cyclable avec plus de <span style="font-weight: bold;color:#0063cb">180 km de pistes et bandes cyclables</span>, et le service DiviaVélo propose des locations longue durée de vélos classiques ou à assistance électrique à partir de 15 euros par mois pour les jeunes.<br /><br />Le centre-ville, largement piétonnier autour du Palais des Ducs et de la rue de la Liberté, se parcourt facilement à pied. Pour rejoindre les zones d\'activités périphériques (Valmy, Cap Nord, Mirande), le tram et les lignes Divia Lianes sont particulièrement efficaces.<br /><br /><span style="font-weight: bold;color:#0063cb">La gare Dijon-Ville, située en plein centre, met Paris à 1h35 et Lyon à 1h40 en TGV</span>, ce qui est un atout majeur pour les alternants souhaitant garder un pied dans une autre ville. L\'aéroport Dijon-Bourgogne assure principalement des liaisons loisirs, tandis que Lyon-Saint-Exupéry est accessible en 2h par la route pour les vols internationaux.',
        transports: [
          { label: "Tramway Divia (2 lignes)", type: "tramway" },
          { label: "Bus Divia", type: "bus" },
          { label: "DiviaVélo", type: "velo" },
          { label: "Centre ville piétonnier", type: "pieton" },
          { label: "Gare Dijon-Ville TGV", type: "tgv" },
          { label: "Aéroport Dijon-Bourgogne", type: "aeroport" },
        ],
      },
      logement: {
        text: `Trouver un logement à Dijon <span style="font-weight: bold;color:#0063cb">reste nettement plus accessible que dans les grandes métropoles</span>, même si la demande se tend à la rentrée. Pour un studio, comptez entre 400 et 550 euros charges comprises selon le quartier et l'état du bien, tandis qu'un T2 se situe généralement entre 550 et 750 euros.<ul><li>Les quartiers les plus prisés par les étudiants et alternants sont <span style="font-weight: bold;color:#0063cb">Université, Montchapet et République</span>, proches des campus et bien desservis par le tram, avec une ambiance jeune et conviviale.</li><li><span style="font-weight: bold;color:#0063cb">Le centre historique (secteur Darcy, Liberté, Wilson)</span> séduit pour son charme et sa proximité avec les commerces, mais les loyers y sont légèrement plus élevés.</li><li><span style="font-weight: bold;color:#0063cb">Les Grésilles, Fontaine d'Ouche ou Chenôve</span>, bien reliés par le tram, proposent des logements plus abordables avec un bon compromis pour les budgets serrés.</li></ul><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches au moins deux mois avant la rentrée</span> sur les plateformes classiques (Leboncoin, PAP, SeLoger) et via les groupes Facebook dédiés au logement étudiant à Dijon, très actifs. Consultez ${MON_LOGEMENT_ETUDIANT_LINK}, pour découvrir de nombreux conseils et les logements disponibles dans votre secteur. Les résidences du CROUS proposent des chambres à partir de 300 euros, et les résidences privées (Studéa, Nexity Studéa, Cardinal Campus) offrent des studios meublés à partir de 500 euros. <span style="font-weight: bold;color:#0063cb">N'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer mensuel</span>. Certains employeurs proposent également une aide au logement dans le cadre du contrat d'alternance, pensez à vous renseigner. Un dossier solide avec garants reste indispensable sur les biens les plus recherchés.`,
        loyers: [
          { type: "Studio", price_range: "400 - 550€" },
          { type: "T2", price_range: "550 - 750€" },
        ],
      },
      loisirs: {
        text: 'Dijon offre une vie culturelle et festive riche qui ravira les alternants en quête d\'équilibre entre vie professionnelle et détente.<ul><li><span style="font-weight: bold;color:#0063cb">Le parcours de la Chouette</span>, balade emblématique à travers le centre historique, permet de découvrir le Palais des Ducs, les hôtels particuliers et les célèbres toits en tuiles vernissées de Bourgogne.</li><li><span style="font-weight: bold;color:#0063cb">Les nombreux bars et restaurants</span> des rues Berbisey, Bannelier et de la place Émile-Zola animent les soirées, avec une ambiance étudiante particulièrement marquée autour de la place de la République.</li><li><span style="font-weight: bold;color:#0063cb">La scène musicale</span> est portée par La Vapeur (salle de musiques actuelles), le Zénith de Dijon, l\'Atheneum et l\'Opéra de Dijon, qui proposent une programmation variée à tarifs réduits pour les moins de 26 ans.</li><li><span style="font-weight: bold;color:#0063cb">Les amateurs de culture</span> profitent du Musée des Beaux-Arts, installé dans le palais ducal et entièrement rénové, gratuit pour tous, ainsi que du FRAC Bourgogne et du cinéma d\'art et essai Eldorado.</li><li><span style="font-weight: bold;color:#0063cb">Le lac Kir</span>, à la sortie de la ville, est le terrain de jeu privilégié des Dijonnais pour courir, faire du vélo ou pique-niquer, complété par le parc de la Colombière et les sentiers de la Combe à la Serpent pour les sportifs.</li><li><span style="font-weight: bold;color:#0063cb">Les festivals rythment l\'année</span>, notamment Tribu Festival, le festival international du film d\'aventure et les Nuits d\'Orient.</li></ul>',
        types: [
          { label: "Promenade historique", type: "promenade" },
          { label: "Gastronomie", type: "gastronomie" },
          { label: "Vie nocturne", type: "bar" },
          { label: "Concerts et opéra", type: "concert" },
          { label: "Musées", type: "musee" },
          { label: "Festivals", type: "musique" },
        ],
      },
    },
  },
  {
    ville: "Clermont-Ferrand",
    cp: "63000",
    slug: "clermont-ferrand",
    region: "Auvergne-Rhône-Alpes",
    geopoint: {
      lat: 45.777222,
      long: 3.087025,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "capitale de l'Auvergne",
        text: "Clermont-Ferrand, préfecture du Puy-de-Dôme et capitale historique de l'Auvergne, compte près de <strong>147 000 habitants</strong> et plus de 300 000 dans sa métropole. Nichée au pied de la chaîne des Puys, classée au patrimoine mondial de l'UNESCO, la ville offre un cadre de vie unique entre ville et volcans. Son centre historique en pierre de Volvic noire, dominé par la cathédrale Notre-Dame-de-l'Assomption, témoigne d'un riche patrimoine médiéval. Clermont-Ferrand accueille plus de <strong>40 000 étudiants</strong>, dont une part croissante d'alternants, créant une atmosphère jeune et conviviale. La ville est mondialement connue comme le berceau de Michelin, et ce poids industriel historique s'accompagne aujourd'hui d'un écosystème tech et santé en pleine expansion. Le coût de la vie y reste particulièrement raisonnable comparé aux grandes métropoles, tout en proposant l'essentiel des services d'une ville universitaire dynamique. Pour un alternant, Clermont-Ferrand combine opportunités professionnelles dans des secteurs de pointe, qualité de vie exceptionnelle et proximité immédiate avec la nature, le tout à 3h30 de Paris en TGV.",
        image: "clermont-ferrand.png",
      },
      vie: {
        text: 'Le tissu économique clermontois est <span style="font-weight: bold;color:#0063cb">solide et diversifié</span>, porté par des fleurons industriels et un écosystème innovant en pleine croissance.<ul><li><span style="font-weight: bold;color:#0063cb">L\'industrie manufacturière</span> reste un pilier avec Michelin, dont le siège mondial emploie plus de 10 000 personnes sur l\'agglomération et recrute massivement des alternants en ingénierie, supply chain, R&D et fonctions support.</li><li><span style="font-weight: bold;color:#0063cb">Le secteur de la santé et des biotechnologies</span> est particulièrement dynamique avec le CHU Gabriel-Montpied, le Centre Jean-Perrin et le pôle de compétitivité Cosmetic Valley qui fédère plus de 400 entreprises dans la cosmétique et la pharmacie.</li><li><span style="font-weight: bold;color:#0063cb">Le numérique et l\'intelligence artificielle</span> connaissent une croissance rapide, portés par la French Tech Clermont Auvergne, avec des entreprises comme Almerys, Limagrain Digital ou Openium, ainsi que de nombreuses start-ups installées au Bivouac.</li><li><span style="font-weight: bold;color:#0063cb">L\'agroalimentaire</span> est incarné par Limagrain, leader mondial des semences, et par le savoir-faire des eaux minérales (Volvic) et des fromages AOP.</li><li>Les secteurs bancaire (Crédit Agricole Centre France), assurantiel (Aésio), ainsi que le commerce et le tourisme, complètent un panorama offrant des opportunités pour tous les profils.</li></ul><span style="font-weight: bold;color:#0063cb">Avec un taux de chômage inférieur à la moyenne nationale</span>, Clermont-Ferrand bénéficie d\'un marché de l\'alternance particulièrement favorable et d\'une proximité facilitée entre étudiants et recruteurs.',
        activites: [],
      },
      mobilite: {
        text: "<span style=\"font-weight: bold;color:#0063cb\">Se déplacer à Clermont-Ferrand est simple et économique</span> grâce au réseau T2C (Transports en Commun Clermontois) qui dessert efficacement l'ensemble de la métropole. Le réseau s'articule autour d'<span style=\"font-weight: bold;color:#0063cb\">une ligne de tramway sur pneus</span> (ligne A), reliant sur 15 km le nord au sud de l'agglomération en desservant les principaux campus universitaires et les pôles d'activité, ainsi que d'une quarantaine de lignes de bus complémentaires.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">L'abonnement mensuel jeune (moins de 26 ans) coûte environ 32 euros</span>, un tarif très avantageux pour les alternants, et votre entreprise d'accueil prend en charge 50% de ce montant.<br /><br />La ville se prête également très bien au vélo grâce à son centre compact et à <span style=\"font-weight: bold;color:#0063cb\">près de 100 km de pistes et bandes cyclables</span>. Le service C.Vélo propose des vélos classiques et électriques en libre-service à partir de 20 euros par mois, particulièrement utile pour compenser les quelques dénivelés du centre-ville.<br /><br />La gare SNCF permet de rejoindre Paris en 3h30 en Intercités, Lyon en 2h30 et Bordeaux en 5h. L'aéroport Clermont-Ferrand Auvergne, accessible en 15 minutes en navette, assure plusieurs liaisons quotidiennes vers Paris et les grandes villes européennes.",
        transports: [
          { label: "Tramway T2C", type: "tramway" },
          { label: "Bus", type: "bus" },
          { label: "C.Vélo", type: "velo" },
          { label: "Centre ville piétonnier", type: "pieton" },
          { label: "Gare SNCF", type: "tgv" },
          { label: "Aéroport", type: "aeroport" },
        ],
      },
      logement: {
        text: `Trouver un logement à Clermont-Ferrand est <span style="font-weight: bold;color:#0063cb">relativement accessible</span> comparé aux grandes métropoles françaises, avec un marché locatif détendu et des loyers parmi les plus abordables des villes universitaires.<br /><br /><span style="font-weight: bold;color:#0063cb">Comptez entre 380 et 520 euros pour un studio</span> charges comprises selon le quartier et l'état du bien, et entre 500 et 700 euros pour un T2.<ul><li>Les quartiers les plus prisés par les alternants et étudiants sont <span style="font-weight: bold;color:#0063cb">Jaude et le centre historique</span>, qui offrent une ambiance animée et une proximité immédiate avec les commerces et sorties.</li><li><span style="font-weight: bold;color:#0063cb">Les Carmes et Delille</span>, légèrement excentrés mais très bien desservis par le tram, proposent un bon compromis qualité-prix avec une forte présence étudiante.</li><li><span style="font-weight: bold;color:#0063cb">Montferrand</span>, partie nord historique de la ville, attire ceux qui recherchent du cachet à des loyers modérés, tandis que <span style="font-weight: bold;color:#0063cb">Cézeaux et Aubière</span>, au sud, concentrent de nombreuses résidences étudiantes près du campus universitaire.</li></ul>Les résidences CROUS proposent des logements à partir de 250 euros mais les places sont limitées et la demande forte en septembre. De nombreuses résidences étudiantes privées (Studéa, Cardinal Campus) offrent des studios meublés avec services à partir de 500 euros. Rendez-vous sur ${MON_LOGEMENT_ETUDIANT_LINK}, un service public ayant pour objectif de faciliter l'accès au logement étudiant pour découvrir plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France.<br /><br /><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches 2 mois avant la rentrée</span> sur Leboncoin, PAP et les groupes Facebook dédiés. N'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer mensuel, et que la garantie Visale (gratuite, proposée par Action Logement) vous dispense de garant pour la plupart des locations.`,
        loyers: [
          { type: "Studio", price_range: "380 - 520€" },
          { type: "T2", price_range: "500 - 700€" },
        ],
      },
      loisirs: {
        text: 'Clermont-Ferrand offre une <span style="font-weight: bold;color:#0063cb">vie culturelle et sportive particulièrement riche</span>, portée par l\'énergie de ses étudiants et la proximité immédiate de la nature.<ul><li><span style="font-weight: bold;color:#0063cb">La chaîne des Puys et le parc naturel régional des Volcans d\'Auvergne</span>, classés à l\'UNESCO, sont accessibles en 20 minutes depuis le centre et offrent un terrain de jeu exceptionnel pour la randonnée, le VTT, le parapente ou la simple détente en pleine nature.</li><li><span style="font-weight: bold;color:#0063cb">Le rugby</span> fait vibrer la ville avec l\'ASM Clermont Auvergne et son stade Marcel-Michelin, véritable institution locale où les alternants trouveront facilement des places à tarif étudiant.</li><li><span style="font-weight: bold;color:#0063cb">Le Festival International du Court-Métrage</span>, deuxième festival de cinéma de France après Cannes, transforme chaque année la ville en capitale mondiale du court en février.</li><li>La place de Jaude, cœur battant de la ville, concentre <span style="font-weight: bold;color:#0063cb">les principaux bars, restaurants et terrasses animées</span>, tandis que le quartier Saint-Pierre et la rue des Petits-Gras proposent une ambiance plus alternative avec pubs étudiants, concerts et soirées thématiques.</li><li><span style="font-weight: bold;color:#0063cb">Les salles de spectacle</span> comme la Coopérative de Mai, scène de musiques actuelles majeure, et l\'Opéra-Théâtre garantissent une programmation variée toute l\'année.</li><li>En hiver, <span style="font-weight: bold;color:#0063cb">les stations de ski du Mont-Dore et de Super-Besse</span>, à 40 minutes de voiture, permettent de skier le week-end à prix raisonnable, un vrai bonus du cadre de vie clermontois.</li></ul>',
        types: [
          { label: "Volcans d'Auvergne", type: "montagne" },
          { label: "ASM Clermont Auvergne", type: "rugby" },
          { label: "Festival du Court-Métrage", type: "cinema" },
          { label: "Bars et restaurants", type: "bar" },
          { label: "Scène musicale", type: "musique" },
          { label: "Ski", type: "ski" },
        ],
      },
    },
  },
  {
    ville: "Metz",
    cp: "57000",
    slug: "metz",
    region: "Grand Est",
    geopoint: {
      lat: 49.119309,
      long: 6.175715,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "la ville jaune",
        text: "Metz, préfecture de la Moselle et ancienne capitale de la Lorraine, séduit les alternants par son cadre de vie remarquable et sa position stratégique au cœur de l'Europe. Avec près de <strong>120 000 habitants</strong> dans la ville et plus de 220 000 dans la métropole, Metz offre une ambiance à taille humaine tout en disposant des atouts d'une grande ville. Surnommée la « ville jaune » en raison de la pierre de Jaumont qui habille ses façades, elle possède un patrimoine exceptionnel avec sa cathédrale Saint-Étienne, l'une des plus vastes de France, et ses 37 hectares d'espaces verts en centre-ville qui en font l'une des villes les plus vertes d'Europe. Le <strong>Centre Pompidou-Metz</strong>, inauguré en 2010, a renforcé son rayonnement culturel. Pour un alternant, Metz représente un excellent équilibre entre coût de la vie maîtrisé, opportunités professionnelles transfrontalières avec le Luxembourg et l'Allemagne, et qualité de vie préservée. La ville accueille près de <strong>22 000 étudiants</strong>, notamment autour du Technopôle et du campus du Saulcy, créant un écosystème jeune et dynamique propice à l'alternance.",
        image: "metz.png",
      },
      vie: {
        text: "Le tissu économique messin est <span style=\"font-weight: bold;color:#0063cb\">diversifié et bénéficie d'une situation transfrontalière unique</span> qui multiplie les opportunités pour les alternants. <ul><li><span style=\"font-weight: bold;color:#0063cb\">Le Technopôle de Metz</span>, premier parc technologique du Grand Est, regroupe plus de 250 entreprises et 7 000 emplois dans le numérique, l'ingénierie et les services, avec des acteurs comme SFR, PwC ou Cegelec qui recrutent régulièrement en alternance.</li><li><span style=\"font-weight: bold;color:#0063cb\">Le secteur bancaire et de l'assurance</span> est fortement implanté avec la Caisse d'Épargne Grand Est Europe, la BPALC ou Groupama qui proposent de nombreux contrats d'alternance dans la relation client et la gestion de patrimoine.</li><li><span style=\"font-weight: bold;color:#0063cb\">La logistique et l'industrie</span> tirent parti de la position stratégique de Metz au carrefour autoroutier et ferroviaire européen, avec des groupes comme PSA, ArcelorMittal ou Thyssenkrupp présents dans le bassin.</li><li>Le secteur public et les collectivités territoriales constituent également un vivier important d'alternances, tout comme <span style=\"font-weight: bold;color:#0063cb\">les métiers du tourisme, de la culture et de la restauration</span> portés par l'attractivité patrimoniale de la ville.</li><li>Enfin, <span style=\"font-weight: bold;color:#0063cb\">la proximité du Luxembourg (45 minutes) et de l'Allemagne</span> ouvre un marché de l'emploi transfrontalier particulièrement dynamique, dans la finance, l'automobile ou l'informatique.</li></ul><span style=\"font-weight: bold;color:#0063cb\">Avec un coût de la vie inférieur à la moyenne des grandes métropoles et un marché de l'emploi tendu</span>, Metz offre aux alternants un bon rapport entre salaire d'apprentissage, niveau de vie et perspectives d'embauche en fin de contrat.",
        activites: [],
      },
      mobilite: {
        text: 'Se déplacer à Metz est <span style="font-weight: bold;color:#0063cb">simple, rapide et économique</span>, un vrai atout pour les alternants qui jonglent entre entreprise et centre de formation. Le réseau LE MET\' est organisé autour de <span style="font-weight: bold;color:#0063cb">deux lignes de Mettis</span>, un bus à haut niveau de service à guidage optique, qui traversent la ville du nord au sud avec une fréquence de 5 à 10 minutes aux heures de pointe, complété par une trentaine de lignes de bus desservant l\'ensemble de l\'agglomération.<br /><br /><span style="font-weight: bold;color:#0063cb">L\'abonnement mensuel LE MET\' jeune (-26 ans) coûte environ 27 euros</span>, un tarif parmi les plus avantageux des grandes villes françaises, et votre employeur prend en charge 50 % de ce montant dans le cadre de votre alternance. La ville est par ailleurs très cyclable avec plus de <span style="font-weight: bold;color:#0063cb">100 km de pistes et voies cyclables</span> et le service de location longue durée Vélomet qui propose des vélos à assistance électrique à partir de 25 euros par mois.<br /><br />La gare de Metz-Ville, classée monument historique, offre <span style="font-weight: bold;color:#0063cb">des connexions TGV vers Paris en 1h22</span>, Strasbourg en 45 minutes et Luxembourg en 35 minutes, rendant les déplacements professionnels et les week-ends particulièrement aisés. L\'aéroport Metz-Nancy-Lorraine, à 25 minutes, complète la desserte longue distance.',
        transports: [
          { label: "Mettis (2 lignes BHNS)", type: "bus" },
          { label: "Bus LE MET'", type: "bus" },
          { label: "Pistes cyclables", type: "velo" },
          { label: "Vélomet", type: "velo" },
          { label: "Gare TGV", type: "tgv" },
          { label: "Aéroport", type: "aeroport" },
        ],
      },
      logement: {
        text: `Trouver un logement à Metz <span style="font-weight: bold;color:#0063cb">reste nettement plus accessible</span> que dans la plupart des grandes métropoles françaises, un avantage de taille pour les alternants. Pour un studio, comptez entre 350 et 500 euros charges comprises selon le quartier et l'état du bien, tandis qu'un T2 se situe généralement entre 500 et 700 euros.<ul><li>Le quartier <span style="font-weight: bold;color:#0063cb">Sablon</span>, très prisé des étudiants et alternants, offre un bon rapport qualité-prix et un accès rapide au centre-ville comme au Technopôle via le Mettis.</li><li><span style="font-weight: bold;color:#0063cb">Le centre-ville et le quartier Gare</span> attirent ceux qui veulent vivre à pied de la plupart des commerces, restaurants et entreprises tertiaires, avec des loyers légèrement plus élevés.</li><li><span style="font-weight: bold;color:#0063cb">Le Saulcy et Queuleu</span> sont appréciés pour leur proximité avec les campus universitaires et leur ambiance résidentielle calme.</li><li><span style="font-weight: bold;color:#0063cb">Borny et Metz-Nord</span> proposent des loyers parmi les plus abordables, bien desservis par les lignes de bus.</li></ul><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches 1 à 2 mois avant la rentrée</span> via les plateformes classiques (Leboncoin, PAP, Studapart) et les agences immobilières locales. Les résidences CROUS et privées (Studéa, Nexity Studéa) constituent une alternative pratique, souvent meublée, à partir de 400 euros. Rendez-vous aussi sur ${MON_LOGEMENT_ETUDIANT_LINK}, un service public ayant pour objectif de faciliter l'accès au logement étudiant pour découvrir plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style="font-weight: bold;color:#0063cb">N'oubliez pas que vous pouvez bénéficier des APL</span>, qui réduisent le loyer de 100 à 200 euros selon vos revenus, et du dispositif Visale (garantie locative gratuite pour les moins de 30 ans) qui simplifie grandement la constitution du dossier.`,
        loyers: [
          { type: "Studio", price_range: "350 - 500€" },
          { type: "T2", price_range: "500 - 700€" },
        ],
      },
      loisirs: {
        text: 'Metz offre une vie culturelle et étudiante <span style="font-weight: bold;color:#0063cb">étonnamment riche pour une ville de sa taille</span>, idéale pour les alternants en quête d\'équilibre entre travail et détente.<ul><li><span style="font-weight: bold;color:#0063cb">Le Centre Pompidou-Metz</span>, antenne du célèbre musée parisien, propose une programmation d\'art moderne et contemporain de premier plan, avec un tarif préférentiel pour les moins de 26 ans.</li><li><span style="font-weight: bold;color:#0063cb">Les bords de la Moselle et le plan d\'eau</span> sont devenus le poumon vert de la ville, parfaits pour courir, pique-niquer ou faire du paddle en été, avec une promenade aménagée jusqu\'à l\'Île du Saulcy.</li><li>La place Saint-Jacques, la place Saint-Louis et les rues piétonnes du centre concentrent <span style="font-weight: bold;color:#0063cb">une vie nocturne animée</span>, avec de nombreux bars étudiants comme le Café Jehanne d\'Arc ou les brasseries de la rue Taison.</li><li>La scène musicale s\'appuie sur <span style="font-weight: bold;color:#0063cb">les Arènes de Metz, la BAM (Boîte à Musiques) et l\'Arsenal</span>, qui accueillent concerts, festivals et spectacles tout au long de l\'année, sans oublier le festival Constellations qui illumine la ville chaque été.</li><li><span style="font-weight: bold;color:#0063cb">Les amateurs de sport</span> profitent des infrastructures municipales, de clubs actifs comme le FC Metz (Ligue 1) et le Metz Handball, et de la proximité des sentiers de randonnée en Moselle.</li><li>Enfin, la position stratégique de Metz permet <span style="font-weight: bold;color:#0063cb">des week-ends faciles à Luxembourg, Sarrebruck, Nancy ou Strasbourg</span>, multipliant les occasions de découvertes sans exploser le budget.</li></ul>',
        types: [
          { label: "Centre Pompidou-Metz", type: "musee" },
          { label: "Bords de la Moselle", type: "quai" },
          { label: "Vie nocturne", type: "bar" },
          { label: "Concerts et festivals", type: "concert" },
          { label: "Sport", type: "sport" },
          { label: "Shopping", type: "shopping" },
        ],
      },
    },
  },
  {
    ville: "Saint-Étienne",
    cp: "42000",
    slug: "saint-etienne",
    region: "Auvergne-Rhône-Alpes",
    geopoint: {
      lat: 45.439695,
      long: 4.387178,
    },
    job_count: 0,
    recruteur_count: 0,
    content: {
      description_ville: {
        title: "ville du design et de l'industrie créative",
        text: "Saint-Étienne, préfecture de la Loire et deuxième ville d'Auvergne-Rhône-Alpes avec près de <strong>170 000 habitants</strong> (400 000 dans la métropole), s'est profondément réinventée ces vingt dernières années. Ancienne capitale industrielle de l'armurerie, du cycle et du textile, la ville est aujourd'hui la seule ville française labellisée <strong>UNESCO Ville Créative de Design</strong>, un statut qui irrigue son économie, ses formations et sa vie urbaine. Avec plus de 25 000 étudiants répartis entre l'Université Jean-Monnet, les Mines de Saint-Étienne, l'ESADSE ou encore Télécom Saint-Étienne, la ville offre un écosystème particulièrement dense pour les alternants. Les loyers sont parmi les plus abordables des grandes villes françaises, ce qui permet de vivre dignement avec un salaire d'apprentissage tout en profitant d'une offre culturelle vivante (Biennale du Design, Cité du Design, MAMC+). Située à 45 minutes de Lyon en TER et entourée des monts du Pilat, du Forez et du Lyonnais, Saint-Étienne combine un tissu industriel qui recrute encore massivement en alternance, une French Tech dynamique et un cadre de vie à taille humaine proche de la nature.",
        image: "saint-etienne.png",
      },
      vie: {
        text: 'Le tissu économique stéphanois conjugue <span style="font-weight: bold;color:#0063cb">héritage industriel et réinvention créative</span>, avec de réelles opportunités pour les alternants. <ul><li><span style="font-weight: bold;color:#0063cb">Le design et les industries créatives</span> structurent l\'identité économique de la ville via la Cité du Design, l\'ESADSE et la Biennale internationale du Design, qui génèrent de nombreux postes en communication, marketing, UX et management de projets.</li><li><span style="font-weight: bold;color:#0063cb">L\'industrie mécanique, l\'optique et la métallurgie</span> restent des filières structurantes avec des employeurs comme Thalès Angénieux, Haulotte Group, NTN-SNR ou encore Aubert & Duval, tous friands d\'alternants en production, maintenance, qualité et bureau d\'études.</li><li><span style="font-weight: bold;color:#0063cb">Le secteur médical et du dispositif médical</span> est particulièrement dense autour du CHU et du technopôle de Saint-Jean-Bonnefonds, avec des entreprises comme Thuasne, Sigvaris ou Precia Molen.</li><li>Le numérique et la French Tech stéphanoise sont portés par le quartier Manufacture - Plaine Achille et des acteurs comme Inetum, Novagray ou Minalogic, qui recrutent en développement, data et cybersécurité.</li><li>La logistique, la grande distribution (Casino, dont le siège historique est à Saint-Étienne) et le BTP complètent un marché d\'alternance particulièrement large pour une ville de cette taille.</li></ul><span style="font-weight: bold;color:#0063cb">Avec un coût de la vie modéré, un bassin étudiant important et une métropole qui investit massivement dans la reconversion de ses friches industrielles</span>, Saint-Étienne offre un marché de l\'alternance accessible et diversifié, y compris pour les profils qui débutent.',
        activites: [],
      },
      mobilite: {
        text: '<span style="font-weight: bold;color:#0063cb">Se déplacer à Saint-Étienne est simple et économique</span> grâce au réseau STAS (Société de Transports de l\'Agglomération Stéphanoise), qui combine trois lignes de tramway (T1, T2 et T3), une quarantaine de lignes de bus et des trolleybus historiques encore en service. Les lignes de tram desservent les principaux pôles de la ville, de Bellevue à La Terrasse en passant par Châteaucreux, le centre-ville et l\'hôpital Nord.<br /><br /><span style="font-weight: bold;color:#0063cb">L\'abonnement mensuel jeune STAS est d\'environ 23 euros pour les moins de 26 ans</span>, l\'un des tarifs les plus bas de France, et votre entreprise d\'accueil en rembourse 50 %. La ville développe également son réseau cyclable, avec près de <span style="font-weight: bold;color:#0063cb">100 km d\'aménagements</span> et le service <span style="font-weight: bold;color:#0063cb">Vélivert</span> qui propose des vélos en libre-service ainsi que des locations longue durée accessibles aux étudiants et alternants.<br /><br />Le centre-ville est compact et largement piétonnier, notamment autour de la place Jean-Jaurès et de la rue des Martyrs de Vingré, ce qui facilite les trajets domicile-formation-entreprise. <span style="font-weight: bold;color:#0063cb">La gare de Châteaucreux, en plein cœur de la ville, permet de rejoindre Lyon Part-Dieu en 45 minutes en TER</span> avec des départs très fréquents, et Paris en 2h50 en TGV direct. Pour les trajets longue distance, l\'aéroport de Saint-Étienne Bouthéon assure quelques liaisons et celui de Lyon Saint-Exupéry est accessible en 1h30 en train + navette.',
        transports: [
          { label: "Tramway (3 lignes)", type: "tramway" },
          { label: "Bus et trolleybus", type: "bus" },
          { label: "Vélivert", type: "velo" },
          { label: "Centre-ville piétonnier", type: "pieton" },
          { label: "Gare de Châteaucreux (TER et TGV)", type: "tgv" },
          { label: "Aéroport Saint-Étienne Bouthéon", type: "aeroport" },
        ],
      },
      logement: {
        text: `Saint-Étienne est <span style="font-weight: bold;color:#0063cb">l'une des grandes villes françaises où le marché locatif est le plus accessible</span> pour les alternants. Pour un studio, comptez en moyenne entre 300 et 450 euros charges comprises, et entre 450 et 650 euros pour un T2, selon le quartier et l'état du bien.<ul><li>Le <span style="font-weight: bold;color:#0063cb">Centre-Ville (autour de la place Jean-Jaurès et de l'Hôtel de Ville)</span> est le plus demandé par les étudiants et alternants pour sa proximité avec les commerces, les facultés et les lignes de tramway.</li><li><span style="font-weight: bold;color:#0063cb">Le quartier Manufacture - Plaine Achille</span>, réhabilité autour de la Cité du Design, attire les jeunes actifs qui travaillent dans le numérique, le design ou la culture, avec des logements récents et de nombreux lieux de vie.</li><li><span style="font-weight: bold;color:#0063cb">Bellevue, Carnot et Châteaucreux</span> offrent de très bons rapports qualité-prix, avec un accès direct au tram et à la gare pour celles et ceux qui alternent entre Saint-Étienne et Lyon.</li><li>Le quartier de Saint-Victor et la Métare plaisent aux étudiants fréquentant le campus Tréfilerie ou le campus Métare, avec des résidences CROUS et privées à tarifs très raisonnables.</li></ul><span style="font-weight: bold;color:#0063cb">Il est recommandé de démarrer ses recherches environ un mois avant la rentrée</span> via Leboncoin, PAP, les agences locales et les groupes Facebook dédiés aux étudiants stéphanois. Les résidences CROUS proposent des chambres et studios à partir de 250 euros, et de nombreuses résidences privées étudiantes complètent l'offre entre 450 et 600 euros pour un studio meublé. Rendez-vous sur ${MON_LOGEMENT_ETUDIANT_LINK}, un service public ayant pour objectif de faciliter l'accès au logement étudiant pour découvrir plus de 300 résidences sociales (soit près de 40000 logements) sur toute la France. <span style="font-weight: bold;color:#0063cb">N'oubliez pas de demander les APL</span>, qui permettent souvent de réduire le loyer de 100 à 200 euros par mois et rendent l'alternance financièrement confortable à Saint-Étienne. Pensez aussi à vérifier si votre employeur propose une aide mobilité ou une prime d'installation.`,
        loyers: [
          { type: "Studio", price_range: "300 - 450€" },
          { type: "T2", price_range: "450 - 650€" },
        ],
      },
      loisirs: {
        text: 'Saint-Étienne offre <span style="font-weight: bold;color:#0063cb">une vie culturelle et sportive particulièrement riche pour une ville de sa taille</span>, nourrie par son identité de Ville UNESCO du Design et par l\'énergie de sa population étudiante.<ul><li><span style="font-weight: bold;color:#0063cb">La Cité du Design, le Musée d\'Art Moderne et Contemporain (MAMC+) et le Musée de la Mine</span> forment un triptyque culturel incontournable, souvent gratuit ou à tarif réduit pour les moins de 26 ans.</li><li><span style="font-weight: bold;color:#0063cb">La vie nocturne étudiante</span> se concentre autour de la rue des Martyrs de Vingré, de la place Jean-Jaurès et du quartier Saint-Jacques, avec de nombreux bars, pubs et cafés-concerts aux prix abordables.</li><li><span style="font-weight: bold;color:#0063cb">Le Fil, la salle Le Méliès, la Comédie de Saint-Étienne et l\'Opéra</span> programment concerts, pièces de théâtre et spectacles toute l\'année à des tarifs accessibles.</li><li><span style="font-weight: bold;color:#0063cb">L\'AS Saint-Étienne et le stade Geoffroy-Guichard</span>, surnommé le "Chaudron", offrent une ambiance footballistique unique en France, très appréciée des alternants venus d\'ailleurs.</li><li>Les amateurs de nature profitent de la <span style="font-weight: bold;color:#0063cb">proximité immédiate du Parc naturel régional du Pilat</span>, idéal pour la randonnée, le VTT ou les sports d\'hiver, ainsi que des stations de ski des monts du Forez et du Haut-Bugey accessibles en 1 à 2 heures.</li><li>Les festivals rythment l\'année avec la <span style="font-weight: bold;color:#0063cb">Biennale Internationale du Design, le festival Paroles et Musiques, Face & Si et le festival du court métrage</span>, qui attirent un public mêlant étudiants, alternants et professionnels.</li></ul>',
        types: [
          { label: "Musées et design", type: "musee" },
          { label: "Bars étudiants", type: "bar" },
          { label: "Concerts et théâtre", type: "concert" },
          { label: "Sport et stade Geoffroy-Guichard", type: "sport" },
          { label: "Randonnée dans le Pilat", type: "promenade" },
          { label: "Festivals", type: "musique" },
        ],
      },
    },
  },
]

export const up = async () => {
  logger.info("Ajout de 10 nouvelles villes SEO dans seo_villes")

  const now = new Date()

  await getDbCollection("seo_villes").insertMany(
    villeData.map((ville) => ({ ...ville, _id: new ObjectId(), cards: [], created_at: now, updated_at: now })),
    { ordered: false, bypassDocumentValidation: true }
  )

  await updateSEO()

  logger.info("Ajout de 10 villes SEO terminé")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
