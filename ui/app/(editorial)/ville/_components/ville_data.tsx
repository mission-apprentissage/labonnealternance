export const villeData = [
  {
    ville: "Bordeaux",
    cp: "33000",
    slug: "bordeaux",
    geopoint: {
      lat: 44.837789,
      long: -0.57918,
    },
    content: {
      description_ville: {
        title: "capitale de la Nouvelle Aquitaine",
        text: "Bordeaux, est une <strong>destination de choix</strong> pour les alternants qui souhaitent allier études, carrière professionnelle et qualité de vie. Classée au patrimoine mondial de l'UNESCO, la ville séduit par son architecture du XVIIIe siècle, ses quais réaménagés le long de la Garonne et son dynamisme culturel. Avec près de <strong>800 000 habitants</strong> dans la métropole, Bordeaux offre un cadre urbain à taille humaine où il fait bon vivre. La ville a connu une transformation spectaculaire ces vingt dernières années, passant d'une cité portuaire endormie à une métropole moderne et attractive. Pour un alternant, Bordeaux représente l'équilibre parfait entre opportunités professionnelles dans des secteurs variés et vie étudiante animée, avec plus de <strong>100 000 étudiants</strong>. Le climat océanique doux, la proximité de l'océan Atlantique (à moins d'une heure) et le vignoble bordelais ajoutent un charme supplémentaire à cette destination. L'ambiance y est conviviale et moins stressante que dans les grandes métropoles comme Paris ou Lyon, tout en offrant des perspectives professionnelles comparables.",
        image: "bordeaux.png",
      },
      vie: {
        text: 'Le tissu économique bordelais est <span style="font-weight: bold;color:#0063cb">diversifié et en pleine expansion</span>, offrant de nombreuses opportunités pour les alternants. <ul><li><span style="font-weight: bold;color:#0063cb">Le secteur du numérique et des nouvelles technologies</span> est particulièrement dynamique, avec plus de 15 000 emplois dans l\'IT et de nombreuses start-ups installées à Darwin, La Mêlée ou dans le quartier Euratlantique.</li><li><span style="font-weight: bold;color:#0063cb">L\'aéronautique et le spatial</span> constituent un pilier majeur avec des entreprises comme Dassault Aviation, Thalès et Safran qui recrutent régulièrement des alternants.</li><li><span style="font-weight: bold;color:#0063cb">Le secteur du vin et des spiritueux</span>, emblématique de la région, propose des postes en marketing, commerce international et œnotourisme.</li><li>La métropole accueille également de grandes entreprises dans le secteur bancaire (Crédit Agricole, CIC) et des assurances, ainsi qu\'<span style="font-weight: bold;color:#0063cb">un pôle santé en développement avec le CHU et de nombreux laboratoires pharmaceutiques</span>.</li><li>Le commerce et le tourisme représentent aussi des viviers d\'alternance importants. Les institutions publiques et les cabinets de conseil sont nombreux dans cette capitale régionale.</li></ul><span style="font-weight: bold;color:#0063cb">Avec un taux de chômage inférieur à la moyenne nationale et une croissance démographique soutenue</span>, Bordeaux attire de plus en plus d\'entreprises nationales et internationales, créant ainsi un marché de l\'alternance particulièrement favorable.',
        activites: [
          { naf_label: "Activités culturelles et festives", rome_codes: ["R1203", "R1204"] },
          { naf_label: "Numérique et nouvelles technologies", rome_codes: [] },
          { naf_label: "Aéronautique et spatial", rome_codes: [] },
          { naf_label: "Commerce et distribution", rome_codes: [] },
          { naf_label: "Tourisme et hôtellerie", rome_codes: [] },
        ],
      },
      mobilite: {
        text: '<span style="font-weight: bold;color:#0063cb">Se déplacer à Bordeaux est facile et accessible</span> grâce à un réseau de transports en commun performant géré par TBM (Transports Bordeaux Métropole). Le réseau compte quatre lignes de tramway (A, B, C et D) qui desservent l\'ensemble de l\'agglomération et constituent l\'épine dorsale des déplacements urbains, avec une fréquence de passage élevée jusqu\'à tard le soir. Les bus complètent efficacement ce réseau avec plus de 70 lignes régulières et des navettes électriques gratuites dans le centre-ville.<br /><br /><span style="font-weight: bold;color:#0063cb">L\'abonnement mensuel TBM coûte environ 37 euros pour les moins de 26 ans</span>, un tarif très avantageux pour les alternants. La ville est également très cyclable avec plus de <span style="font-weight: bold;color:#0063cb">200 km de pistes cyclables</span>, et le service V³ (Vcub) propose des vélos en libre-service <span style="font-weight: bold;color:#0063cb">à partir de 10 euros par mois</span>. De nombreux alternants optent pour le vélo, particulièrement adapté au relief plat de la ville.<br /><br />Pour rejoindre les entreprises situées en périphérie, <span style="font-weight: bold;color:#0063cb">le réseau TransGironde assure des liaisons départementales</span>. La gare Saint-Jean, desservie par TGV, permet de rejoindre Paris en 2h et les principales villes françaises. Enfin, Bordeaux dispose d\'un aéroport international à Mérignac, accessible en 30 minutes en navette.</span>',
        transports: [
          { label: "Bus", type: "bus" },
          { label: "Tramway", type: "tramway" },
          { label: "Pistes cyclables", type: "trottinette" },
          { label: "Trains régionaux et TGV", type: "train" },
          { label: "Vélos en libre-service", type: "velo" },
          { label: "Aéroport", type: "aeroport" },
        ],
      },
      logement: {
        text: 'Trouver un logement à Bordeaux <span style="font-weight: bold;color:#0063cb">nécessite une recherche active</span> mais reste accessible pour les alternants avec un budget adapté. Pour un studio, comptez entre 450 et 650 euros charges comprises selon le quartier et l\'état du bien, tandis qu\'un T2 se situe généralement entre 600 et 850 euros.<ul><li>Les quartiers les plus prisés par les étudiants et alternants sont <span style="font-weight: bold;color:#0063cb">la Victoire, Saint-Michel et Capucins</span>, offrant un bon rapport qualité-prix et une ambiance jeune et dynamique.</li><li><span style="font-weight: bold;color:#0063cb">Les Chartrons et Bacalan</span> attirent ceux qui recherchent un cadre plus moderne et rénové, avec des loyers légèrement supérieurs.</li><li><span style="font-weight: bold;color:#0063cb">Bastide</span>, sur la rive droite, propose des logements plus abordables avec un accès direct au centre-ville par le tram.</li></ul><span style="font-weight: bold;color:#0063cb">Il est recommandé de commencer ses recherches au moins deux mois avant la rentrée</span> sur les plateformes classiques (Leboncoin, PAP) et les groupes Facebook dédiés. Les résidences étudiantes privées constituent une alternative pratique mais souvent plus onéreuse (650-800 euros pour un studio meublé). <span style="font-weight: bold;color:#0063cb">N\'oubliez pas que vous pouvez bénéficier des APL pour réduire votre loyer mensuel</span>. Certains employeurs proposent également une aide au logement dans le cadre du contrat d\'alternance, pensez à vous renseigner. La forte demande locative nécessite de constituer un dossier solide avec garants.',
        loyers: [
          { type: "Studio", price_range: "450 - 650€" },
          { type: "T2", price_range: "650 - 900€" },
        ],
      },
      loisirs: {
        text: 'Bordeaux offre une vie culturelle et festive particulièrement riche qui ravira les alternants en quête d\'équilibre entre vie professionnelle et détente.<ul><li><span style="font-weight: bold;color:#0063cb">Les quais de la Garonne</span>, entièrement réaménagés, constituent le lieu de promenade et de rassemblement privilégié des Bordelais, idéal pour courir ou se retrouver entre amis.</li><li><span style="font-weight: bold;color:#0063cb">La Cité du Vin, monument architectural</span> dédié aux cultures du vin, propose des expositions permanentes et des dégustations.</li><li><span style="font-weight: bold;color:#0063cb">Les nombreux bars et restaurants</span> du quartier Saint-Pierre, Saint-Michel et des Chartrons animent les soirées, avec une ambiance étudiante particulièrement présente place de la Victoire et rue Saint-Rémi.</li><li><span style="font-weight: bold;color:#0063cb">Darwin, l\'écosystème alternatif</span> installé dans une ancienne caserne, accueille un skatepark, des food-trucks, des concerts et des événements éco-responsables.</li><li>La ville compte plusieurs <span style="font-weight: bold;color:#0063cb">salles de concert (Rock School Barbey, I.Boat, Krakatoa) et théâtres</span> pour tous les goûts musicaux. Les amateurs de culture peuvent profiter de nombreux musées (CAPC, Musée d\'Aquitaine) et cinémas, dont plusieurs cinémas d\'art et essai.</li><li><span style="font-weight: bold;color:#0063cb">Le sport</span> est également accessible avec des infrastructures municipales nombreuses, des clubs associatifs et la proximité des plages du bassin d\'Arcachon et des spots de surf de la côte atlantique.</li><li><span style="font-weight: bold;color:#0063cb">Les festivals rythment l\'année</span>, notamment Bordeaux Fête le Vin et Bordeaux Métropole.</li></ul>',
        types: [
          { label: "Promenade", type: "promenade" },
          { label: "Expositions", type: "musee" },
          { label: "Vie nocturne", type: "bar" },
          { label: "Culture alternative", type: "alternatif" },
          { label: "Concerts et théâtre", type: "concert" },
          { label: "Sports", type: "sport" },
        ],
      },
    },
  },
  {
    ville: "Paris",
    slug: "paris",
    geopoint: { lat: 48.856613, long: 2.352222 },
    content: {
      description_ville: {
        title: "La ville lumière",
        text: "Paris, capitale française de plus de 2 millions d'habitants (12 millions dans l'agglomération), représente un terrain de jeu exceptionnel pour les alternants. La Ville Lumière concentre une densité incomparable d'entreprises, d'écoles supérieures et d'opportunités professionnelles dans tous les secteurs d'activité. Vivre son alternance à Paris, c'est bénéficier d'un réseau professionnel unique, d'une offre culturelle sans égal et d'une expérience urbaine intense qui façonne véritablement un début de carrière. Malgré un coût de la vie élevé, Paris reste la ville où les salaires d'alternance sont souvent les plus attractifs et où les perspectives d'évolution après le diplôme sont les plus nombreuses. L'effervescence constante de la capitale, ses quartiers aux identités marquées et son rayonnement international en font une destination privilégiée pour les étudiants ambitieux. Vous découvrirez une ville certes exigeante, mais qui récompense ceux qui savent saisir les opportunités qu'elle offre au quotidien.",
        image: "paris.png",
      },
      vie: {
        text: "Paris constitue le premier bassin d'emploi français avec une concentration exceptionnelle d'entreprises de toutes tailles.<ul><li><span style=\"font-weight: bold;color:#0063cb\">Les sièges sociaux des groupes du CAC 40</span> sont majoritairement implantés à Paris et La Défense, premier quartier d'affaires européen, offrant des milliers de postes en alternance dans la finance, le conseil, l'assurance et les services.</li><li><span style=\"font-weight: bold;color:#0063cb\">Le dynamisme des start-ups</span> est particulièrement remarquable dans des quartiers comme le Sentier (surnommé &quote;Silicon Sentier&quote;), Station F (le plus grand incubateur du monde), et les arrondissements du nord-est parisien. Les secteurs du luxe (LVMH, Kering, L'Oréal), de la mode, du digital, de la communication et du marketing sont omniprésents et recrutent massivement des alternants.</li><li><span style=\"font-weight: bold;color:#0063cb\">Les PME innovantes</span> foisonnent dans les 11e, 18e et 19e arrondissements, tandis que les institutions publiques et organisations internationales proposent également des contrats d'apprentissage.</li></ul>La diversité sectorielle parisienne permet à chaque profil de trouver une entreprise correspondant à son projet professionnel, que vous visiez une multinationale structurée ou une structure plus agile et entrepreneuriale.",
        activites: [
          { naf_label: "Activités culturelles et festives", rome_codes: ["R1203", "R1204"] },
          { naf_label: "Numérique et nouvelles technologies", rome_codes: [] },
          { naf_label: "Aéronautique et spatial", rome_codes: [] },
          { naf_label: "Commerce et distribution", rome_codes: [] },
          { naf_label: "Tourisme et hôtellerie", rome_codes: [] },
        ],
      },
      mobilite: {
        text: "Se déplacer à Paris en alternance est facilité par un réseau de transports en commun parmi les plus développés au monde.<br /><br />Le métro avec ses 16 lignes, le RER, les bus et tramways permettent de rejoindre quasiment n'importe quel point de la capitale en moins d'une heure. Le pass Navigo mensuel coûte 86,40€ (zones 1-5) mais votre entreprise d'accueil prendra en charge 50% de ce montant, soit environ 43€ à votre charge.<br /><br />Les services Vélib' (vélos en libre-service) et les trottinettes électriques complètent l'offre de mobilité douce, particulièrement pratiques pour les derniers kilomètres. Paris développe constamment ses pistes cyclables, rendant le vélo personnel de plus en plus attractif pour les trajets domicile-travail-école. <br /><br />Attention toutefois aux heures de pointe (8h-9h30 et 17h30-19h30) où le métro peut être très chargé, notamment sur les lignes 1, 4, 13 et le RER A. L'application Citymapper deviendra rapidement votre meilleure alliée pour optimiser vos déplacements et anticiper les perturbations.",
        transports: [
          { label: "Bus", type: "bus" },
          { label: "Tramway", type: "tramway" },
          { label: "Pistes cyclables", type: "trottinette" },
          { label: "Trains régionaux et TGV", type: "train" },
          { label: "Vélos en libre-service", type: "velo" },
          { label: "Aéroport", type: "aeroport" },
        ],
      },
      logement: {
        text: 'Le logement représente le principal défi financier pour les alternants à Paris, avec des loyers parmi les plus élevés de France.<ul><li><span style="font-weight: bold;color:#0063cb">Comptez entre 700€ et 1000€ par mois pour un studio</span> (15-25m²) et entre 1000€ et 1500€ pour un T2, selon l\'arrondissement et l\'état du bien. Les arrondissements périphériques (18e, 19e, 20e, 13e) et les villes limitrophes de petite couronne (Montreuil, Saint-Denis, Ivry, Pantin) offrent des loyers plus abordables tout en restant bien desservis par les transports.</li><li><span style="font-weight: bold;color:#0063cb">Les résidences étudiantes</span> comme les Estudines ou Cardinal Campus proposent des logements meublés avec services, souvent plus chers mais sans les tracas de l\'ameublement. N\'oubliez pas de demander l\'APL (aide personnalisée au logement) qui peut réduire significativement votre loyer de 100 à 250€ selon vos revenus.</li><li><span style="font-weight: bold;color:#0063cb">Les colocations</span> restent une solution populaire pour réduire les coûts et créer du lien social, avec des loyers entre 500€ et 800€ par chambre.</li></ul>Anticipez vos recherches au moins 2-3 mois avant votre arrivée via des plateformes comme Leboncoin, PAP, ou La Carte des Colocs, et préparez un dossier solide avec garant car la concurrence est féroce sur le marché locatif parisien.',
        loyers: [
          { type: "Studio", price_range: "700 - 1000€" },
          { type: "T2", price_range: "1000 - 1500€" },
        ],
      },
      loisirs: {
        text: 'Paris offre une richesse culturelle et récréative inépuisable pour profiter de votre vie d\'alternant en dehors du rythme travail-école.<ul><li><span style="font-weight: bold;color:#0063cb">Les musées parisiens</span> (Louvre, Orsay, Pompidou, Picasso) proposent souvent des tarifs réduits ou des nocturnes gratuites pour les jeunes de moins de 26 ans.</li><li>Les quartiers du Marais, Oberkampf, Bastille et Belleville concentrent <span style="font-weight: bold;color:#0063cb">une vie nocturne dynamique</span> avec bars, clubs et salles de concert adaptés aux budgets étudiants.</li><li><span style="font-weight: bold;color:#0063cb">Les parcs et jardins</span> (Luxembourg, Buttes-Chaumont, Tuileries, bords de Seine) deviennent des lieux de détente essentiels, notamment l\'été pour pique-niquer entre alternants.</li><li><span style="font-weight: bold;color:#0063cb">La scène sportive</span> est riche avec de nombreuses salles de sport, piscines municipales à tarifs attractifs, et la possibilité de pratiquer le running le long des canaux ou de la Seine.</li><li><span style="font-weight: bold;color:#0063cb">Les cinémas</span> proposent des abonnements illimités avantageux (UGC, Pathé, MK2) et les théâtres offrent des places à prix réduit pour les moins de 28 ans.</li></ul><span style="font-weight: bold;color:#0063cb">Entre festivals gratuits, expositions éphémères, marchés vintage et événements de networking professionnels</span>, vous ne connaîtrez jamais l\'ennui dans la capitale.',
        types: [
          { label: "Promenade", type: "promenade" },
          { label: "Expositions", type: "musee" },
          { label: "Vie nocturne", type: "bar" },
          { label: "Culture alternative", type: "alternatif" },
          { label: "Concerts et théâtre", type: "concert" },
          { label: "Sports", type: "sport" },
        ],
      },
    },
  },
  {
    ville: "Lyon",
    slug: "lyon",
    geopoint: {
      lat: 45.764043,
      long: 4.835659,
    },
    content: {
      main: {
        title: "Trouver une alternance à Lyon",
        text: "Lyon, troisième métropole de France, offre un cadre exceptionnel pour débuter votre carrière en alternance. Avec plus de 170 000 étudiants et un tissu économique diversifié, la capitale des Gaules regorge d’opportunités dans les biotechnologies, le digital, la banque et l’industrie. Les entreprises comme Sanofi, BioMérieux, Renault Trucks ou encore les startups de Lyon French Tech recrutent activement des alternants. Située à seulement 2h de Paris en TGV, Lyon combine dynamisme économique et qualité de vie exceptionnelle. Entre son patrimoine UNESCO, sa gastronomie renommée et ses nombreux événements culturels, vous profiterez d’un environnement stimulant pour vos études et votre vie personnelle. Le réseau TCL facilite vos déplacements quotidiens à tarif réduit. Lyon est définitivement la ville idéale pour réussir votre formation en alternance.",
        image: "lyon-alternance-place-bellecour.jpg",
      },
      description_ville: {
        title: "Lyon, capitale de la gastronomie et métropole dynamique",
        subtitle: "",
        text: "Lyon, avec ses 522 000 habitants et sa métropole de 1,4 million d’habitants, se positionne comme la troisième ville de France et un pôle économique majeur. Capitale historique de la région Auvergne-Rhône-Alpes, elle accueille près de 170 000 étudiants répartis dans trois universités et de prestigieuses grandes écoles comme l’INSA Lyon, l’École Centrale ou EM Lyon. Son économie diversifiée s’appuie sur des secteurs d’excellence comme les biotechnologies et la pharmacie avec des leaders mondiaux tels que Sanofi et BioMérieux, le digital avec l’écosystème Lyon French Tech, la banque et l’assurance, la chimie de pointe, ainsi que la logistique et l’industrie manufacturière. Classée au patrimoine mondial de l’UNESCO, Lyon est également réputée pour sa gastronomie exceptionnelle, ses bouchons typiques et son art de vivre. Idéalement située entre les Alpes et la Méditerranée, au confluent du Rhône et de la Saône, la ville bénéficie d’une position géographique stratégique qui en fait un carrefour européen incontournable pour les entreprises et les talents.",
        data: null,
      },
      opportunite_emploi: {
        text: "Le marché de l’emploi en alternance à Lyon est particulièrement dynamique et diversifié, offrant des perspectives exceptionnelles aux jeunes en formation. Le secteur des biotechnologies et de la santé constitue un pilier majeur avec des entreprises comme Sanofi Pasteur, BioMérieux, Boiron et Merial qui proposent régulièrement des contrats d’alternance dans la recherche, la production et la qualité. L’écosystème Lyon French Tech, l’un des plus importants de France, génère de nombreuses opportunités dans le développement web, la data science, la cybersécurité et le marketing digital au sein de startups innovantes et de scale-ups. Le secteur bancaire et assurantiel, avec des sièges régionaux de Société Générale, LCL, April et de nombreuses mutuelles, recrute des alternants en finance, gestion de patrimoine et relation client. L’industrie manufacturière reste forte avec Renault Trucks, le Groupe SEB et de nombreux équipementiers qui recherchent des profils techniques en ingénierie, maintenance et supply chain. La chimie, à travers le pôle Axel’One, et la logistique, favorisée par la position stratégique de Lyon, complètent ce paysage économique. Les PME et ETI, très nombreuses dans la région, offrent également d’excellentes opportunités d’apprentissage dans tous les domaines, du commerce à la communication en passant par les ressources humaines. Cette diversité sectorielle garantit aux alternants de trouver des postes adaptés à leur profil, quel que soit leur niveau d’études, du BTS au diplôme d’ingénieur ou d’école de commerce.",
      },
      mobilite: {
        text: "Se déplacer à Lyon en tant qu’alternant est particulièrement simple et économique grâce au réseau TCL (Transports en Commun Lyonnais) qui comprend 4 lignes de métro, 7 lignes de tramway, 2 funiculaires et un vaste réseau de bus couvrant toute la métropole. Les jeunes de moins de 26 ans bénéficient d’un tarif préférentiel avec l’abonnement Jeune à environ 36 euros par mois, permettant des déplacements illimités. Le service Vélo’v, avec ses nombreuses stations réparties dans toute la ville, propose une alternative écologique pour environ 35 euros par an. Lyon Part-Dieu, principale gare TGV, vous connecte à Paris en seulement 2 heures, à Marseille en 1h45 et aux principales villes européennes. L’aéroport Lyon-Saint-Exupéry, accessible en 30 minutes via le Rhônexpress, offre des liaisons nationales et internationales. Concernant le logement, comptez entre 450 et 650 euros pour un studio et entre 650 et 900 euros pour un T2, avec des variations selon les quartiers. La Guillotière, multiculturelle et dynamique, la Croix-Rousse au charme bohème, Gerland avec ses infrastructures modernes et Villeurbanne, plus abordable et très étudiante, sont des quartiers particulièrement adaptés aux alternants. Pour financer votre logement, vous pouvez bénéficier des aides au logement comme l’APL, du dispositif Action Logement pour l’avance de dépôt de garantie, et de Visale qui propose une caution gratuite pour les moins de 30 ans. La Métropole de Lyon propose également des programmes d’accompagnement spécifiques pour faciliter l’accès au logement des jeunes en formation.",
      },
      loisir: {
        text: "Lyon offre une vie culturelle et festive exceptionnelle qui séduira tous les alternants en quête d’équilibre entre travail et loisirs. Le patrimoine culturel est remarquable avec le Musée des Beaux-Arts, l’un des plus riches de France, le Musée des Confluences dédié aux sciences et aux sociétés, et l’Institut Lumière qui célèbre la naissance du cinéma dans la ville des frères Lumière. Les amateurs de spectacles vivants apprécieront l’Opéra National de Lyon, les Nuits de Fourvière qui transforment le théâtre antique en scène magique chaque été, et la Maison de la Danse réputée internationalement. La Presqu’île, cœur battant de Lyon entre Rhône et Saône, concentre boutiques, restaurants et bars branchés, tandis que les Pentes de la Croix-Rousse offrent une ambiance alternative avec leurs fresques murales, leurs boutiques créatives et leurs bars animés. Le Vieux Lyon, avec ses traboules mystérieuses et ses bouchons traditionnels, permet de découvrir l’authentique gastronomie lyonnaise. Les berges du Rhône et du parc de la Tête d’Or, poumon vert de 115 hectares, sont parfaits pour le jogging, le vélo ou simplement se détendre entre amis. Le quartier de la Confluence, ultra-moderne, abrite Le Sucre, club électro incontournable, et Le Transbordeur pour les concerts. Lyon vibre au rythme d’événements majeurs comme la Fête des Lumières en décembre qui attire des millions de visiteurs, Nuits Sonores pour les amateurs de musique électronique, et la Biennale de la Danse. Les Halles de Lyon Paul Bocuse raviront les gourmets, tandis que les nombreux cinémas, dont le Comoedia art et essai, satisferont les cinéphiles. Pour les sportifs, les Alpes sont à moins de deux heures pour le ski l’hiver, et les massifs du Beaujolais et du Pilat offrent de superbes randonnées. Cette richesse culturelle et la douceur de vivre lyonnaise font de la ville un cadre idéal pour s’épanouir pendant vos années d’alternance.",
      },
    },
  },
  {
    ville: "Marseille",
    slug: "marseille",
    geopoint: {
      lat: 43.296482,
      long: 5.36978,
    },
    content: {},
  },
  {
    ville: "Toulouse",
    slug: "toulouse",
    geopoint: {
      lat: 43.604652,
      long: 1.444209,
    },
    content: {},
  },
  { ville: "Strasbourg", slug: "strasbourg", geopoint: { lat: 48.573405, long: 7.752111 }, content: {} },
  { ville: "Nantes", slug: "nantes", geopoint: { lat: 47.218371, long: -1.553621 }, content: {} },
  { ville: "Rennes", slug: "rennes", geopoint: { lat: 48.117266, long: -1.677793 }, content: {} },
  { ville: "Montpellier", slug: "montpellier", geopoint: { lat: 43.611667, long: 3.877222 }, content: {} },
  { ville: "Lille", slug: "lille", geopoint: { lat: 50.62925, long: 3.057256 }, content: {} },
  { ville: "Grenoble", slug: "grenoble", geopoint: { lat: 45.188529, long: 5.724524 }, content: {} },
]
