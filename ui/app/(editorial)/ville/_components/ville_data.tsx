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
          { label: "Trains régionaux et TGV", type: "tgv" },
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
          { label: "Sport", type: "sport" },
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
        text: "Paris constitue le premier bassin d'emploi français avec une concentration exceptionnelle d'entreprises de toutes tailles.<ul><li><span style=\"font-weight: bold;color:#0063cb\">Les sièges sociaux des groupes du CAC 40</span> sont majoritairement implantés à Paris et La Défense, premier quartier d'affaires européen, offrant des milliers de postes en alternance dans la finance, le conseil, l'assurance et les services.</li><li><span style=\"font-weight: bold;color:#0063cb\">Le dynamisme des start-ups</span> est particulièrement remarquable dans des quartiers comme le Sentier (surnommé &quot;Silicon Sentier&quot;), Station F (le plus grand incubateur du monde), et les arrondissements du nord-est parisien. Les secteurs du luxe (LVMH, Kering, L'Oréal), de la mode, du digital, de la communication et du marketing sont omniprésents et recrutent massivement des alternants.</li><li><span style=\"font-weight: bold;color:#0063cb\">Les PME innovantes</span> foisonnent dans les 11e, 18e et 19e arrondissements, tandis que les institutions publiques et organisations internationales proposent également des contrats d'apprentissage.</li></ul>La diversité sectorielle parisienne permet à chaque profil de trouver une entreprise correspondant à son projet professionnel, que vous visiez une multinationale structurée ou une structure plus agile et entrepreneuriale.",
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
          { label: "Métro", type: "metro" },
          { label: "RER", type: "train" },
          { label: "5 gares", type: "tgv" },
          { label: "Vélib'", type: "velo" },
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
          { label: "Parcs et jardin", type: "promenade" },
          { label: "Les musées", type: "musee" },
          { label: "Vie nocturne", type: "bar" },
          { label: "Cinéma", type: "cinema" },
          { label: "Concerts et théâtre", type: "concert" },
          { label: "Sport", type: "sport" },
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
      description_ville: {
        title: "3ème ville de France",
        text: "Lyon, troisième ville de France avec près de 520 000 habitants (1,4 million dans l'agglomération), est une destination de choix pour les alternants. Nichée au confluent du Rhône et de la Saône, la capitale des Gaules bénéficie d'une position géographique stratégique, à seulement 2h de Paris en TGV et proche des Alpes et de la Méditerranée. Son centre historique, classé au patrimoine mondial de l'UNESCO, témoigne d'un riche passé culturel qui se marie harmonieusement avec une économie dynamique et innovante. Lyon offre une qualité de vie exceptionnelle pour les étudiants alternants : une scène culturelle vibrante, une gastronomie renommée, des espaces verts nombreux et un coût de la vie plus abordable qu'à Paris. La ville compte plus de 150 000 étudiants, créant ainsi une ambiance jeune et énergique dans de nombreux quartiers. Pour un alternant, Lyon représente le compromis idéal entre opportunités professionnelles de haut niveau et douceur de vivre, avec un tissu économique diversifié qui facilite grandement la recherche de contrats d'alternance dans pratiquement tous les secteurs d'activité.",
        image: "lyon.png",
      },
      vie: {
        text: 'Lyon dispose d\'un écosystème économique particulièrement riche et diversifié, offrant d\'excellentes perspectives pour les alternants de tous horizons.<ul><li>La ville est historiquement reconnue comme <span style="font-weight: bold;color:#0063cb">un pôle majeur de l\'industrie chimique et pharmaceutique</span>, abritant les sièges de Sanofi, Boiringer Ingelheim et de nombreux laboratoires dans la vallée de la chimie au sud de l\'agglomération.</li><li><span style="font-weight: bold;color:#0063cb">Le secteur des biotechnologies et des sciences de la vie</span> connaît un développement fulgurant, notamment dans le quartier de Gerland qui héberge des dizaines de startups et PME innovantes.</li><li>Lyon est également un hub digital important avec plus de 1 500 entreprises du numérique, concentrées notamment dans les quartiers de la Part-Dieu et de Vaise, offrant de nombreuses opportunités en <span style="font-weight: bold;color:#0063cb">développement web, data science et cybersécurité</span>.</li><li><span style="font-weight: bold;color:#0063cb">Le secteur bancaire et assurantiel</span> est très présent avec April, Apicil et de nombreuses banques régionales, tandis que l\'industrie traditionnelle reste solide avec des acteurs comme Renault Trucks.</li></ul>Les services aux entreprises, le commerce, la logistique (grâce à la proximité de grands axes autoroutiers) et le tourisme complètent ce tableau économique diversifié, permettant aux alternants de trouver des opportunités dans pratiquement tous les domaines de formation.',
        activites: [
          { naf_label: "Activités culturelles et festives", rome_codes: ["R1203", "R1204"] },
          { naf_label: "Numérique et nouvelles technologies", rome_codes: [] },
          { naf_label: "Aéronautique et spatial", rome_codes: [] },
          { naf_label: "Commerce et distribution", rome_codes: [] },
          { naf_label: "Tourisme et hôtellerie", rome_codes: [] },
        ],
      },
      mobilite: {
        text: 'Se déplacer à Lyon est particulièrement aisé grâce à un réseau de transports en commun dense et efficace géré par les TCL (Transports en Commun Lyonnais).<br /><br />Le réseau comprend : <ul><li><span style="font-weight: bold;color:#0063cb">4 lignes de métro automatique</span>,</li><li><span style="font-weight: bold;color:#0063cb">7 lignes de tramway</span>,</li><li><span style="font-weight: bold;color:#0063cb">2 funiculaires historiques</span> montant à Fourvière</li><li>et de nombreuses lignes de bus qui desservent l\'ensemble de l\'agglomération, avec des fréquences élevées notamment aux heures de pointe.</li></ul>L\'abonnement mensuel jeune (moins de 26 ans) coûte environ 36 euros, ce qui représente un investissement raisonnable pour une mobilité illimitée dans toute l\'agglomération.<br /><br />Lyon est également <span style="font-weight: bold;color:#0063cb">une ville très cyclable</span>, avec plus de 1 000 km de pistes et bandes cyclables, et le système de vélos en libre-service Vélo\'v qui compte près de 5 000 vélos disponibles dans 430 stations.<br /><br />Pour les trajets plus longs, <span style="font-weight: bold;color:#0063cb">la gare de Lyon Part-Dieu</span> est un hub national majeur avec des TGV vers toutes les grandes villes françaises, pratique pour rentrer voir sa famille.<br /><br />La ville est aussi très accessible à pied, notamment dans les quartiers centraux comme la Presqu\'île, le Vieux-Lyon ou les pentes de la Croix-Rousse, permettant souvent de limiter les frais de transport pour les courts trajets quotidiens.',
        transports: [
          { label: "4 lignes de métro", type: "metro" },
          { label: "7 lignes de tramway", type: "tramway" },
          { label: "Funiculaire", type: "funiculaire" },
          { label: "Bus", type: "bus" },
          { label: "Vélo'v", type: "velo" },
          { label: "Gare de Lyon Part-Dieu", type: "tgv" },
        ],
      },
      logement: {
        text: 'Le marché du logement à Lyon pour les alternants présente des défis mais reste plus abordable que Paris, avec des différences importantes selon les quartiers.<ul><li><span style="font-weight: bold;color:#0063cb">Pour un studio (20-25m²), il faut compter entre 450 et 650 euros</span> par mois charges comprises dans les quartiers périphériques comme Villeurbanne, Vaise ou Gerland, et entre 600 et 800 euros dans les secteurs plus centraux comme la Guillotière, la Croix-Rousse ou Bellecour.</li><li><span style="font-weight: bold;color:#0063cb">Un T2 (35-45m²) à partager en colocation coûte généralement entre 700 et 1 000 euros</span> dans les zones moins centrales, et peut atteindre 1 200 euros dans les quartiers prisés de la Presqu\'île ou du Vieux-Lyon. Les quartiers particulièrement populaires auprès des étudiants et alternants sont la Guillotière (multiculturel et vivant), Villeurbanne notamment autour du campus de la Doua, les pentes de la Croix-Rousse (bohème et animé), Gerland (en pleine rénovation avec de nombreuses résidences récentes) et Vaise (bien desservi et plus calme).</li></ul><span style="font-weight: bold;color:#0063cb">Un T2 (35-45m²) à partager en colocation coûte généralement entre 700 et 1 000 euros dans les zones moins centrales, et peut atteindre 1 200 euros dans les quartiers prisés</span> de la Presqu\'île ou du Vieux-Lyon. Les quartiers particulièrement populaires auprès des étudiants et alternants sont la Guillotière (multiculturel et vivant), Villeurbanne notamment autour du campus de la Doua, les pentes de la Croix-Rousse (bohème et animé), Gerland (en pleine rénovation avec de nombreuses résidences récentes) et Vaise (bien desservi et plus calme).</li></ul>Il est recommandé de commencer ses recherches au moins 2-3 mois avant la rentrée via les plateformes classiques (Leboncoin, SeLoger), mais aussi via les résidences étudiantes privées (Studéa, Nexity Studéa) et les CROUS qui proposent des logements à tarifs avantageux. N\'oubliez pas que vous pouvez bénéficier des APL pour réduire significativement votre loyer, et que certaines entreprises d\'accueil proposent des aides au logement pour leurs alternants.',
        loyers: [
          { type: "Studio", price_range: "450 - 650€" },
          { type: "T2", price_range: "700 - 1000€" },
        ],
      },
      loisirs: {
        text: 'Lyon offre une richesse culturelle et des possibilités de loisirs exceptionnelles pour les alternants souhaitant profiter de leur temps libre.<ul><li>La ville compte de <span style="font-weight: bold;color:#0063cb">nombreux musées de qualité</span> comme le musée des Confluences, le musée des Beaux-Arts et le musée Lumière célébrant les inventeurs du cinéma, avec souvent des tarifs réduits pour les étudiants.</li><li>La <span style="font-weight: bold;color:#0063cb">scène musicale lyonnaise est dynamique</span> avec des salles mythiques comme le Transbordeur, la Rayonne ou le Ninkasi Kao, proposant régulièrement des concerts de tous styles à des prix accessibles.</li><li><span style="font-weight: bold;color:#0063cb">Les quais du Rhône et de Saône</span>, entièrement réaménagés, sont devenus des lieux de vie prisés pour courir, pique-niquer ou simplement se détendre entre amis, notamment aux Berges du Rhône et au parc de la Tête d\'Or, l\'un des plus grands parcs urbains de France.</li><li><span style="font-weight: bold;color:#0063cb">La vie nocturne</span> se concentre principalement autour de la Guillotière, des pentes de la Croix-Rousse et du Vieux-Lyon, avec une multitude de bars, pubs et clubs adaptés à tous les budgets. Lyon accueille également des événements majeurs comme la Fête des Lumières en décembre, les Nuits Sonores (festival de musiques électroniques), et de nombreux festivals de cinéma.</li><li>Enfin, <span style="font-weight: bold;color:#0063cb">la gastronomie lyonnaise accessible</span> via les célèbres bouchons permet de découvrir la culture locale, tandis que la proximité des Alpes offre la possibilité de partir skier ou randonner le week-end.</li></ul>',
        types: [
          { label: "Musées", type: "musee" },
          { label: "Quais", type: "quai" },
          { label: "Vie nocturne", type: "bar" },
          { label: "Gastronomie", type: "gastronomie" },
          { label: "Scène musicale", type: "musique" },
          { label: "Randonnées et ski", type: "montagne" },
        ],
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
    content: {
      description_ville: {
        title: "métropole méditerranéenne",
        text: "Marseille, deuxième ville de France avec ses 870 000 habitants, est une métropole méditerranéenne vibrante qui offre un cadre de vie exceptionnel pour les alternants. Située entre mer et collines, la cité phocéenne bénéficie d'un ensoleillement généreux (300 jours par an) et d'un art de vivre typiquement provençal. Son caractère multiculturel, forgé par 2600 ans d'histoire et son statut de premier port français, en fait une ville cosmopolite et dynamique. Pour les jeunes en formation, Marseille représente un terrain idéal combinant opportunités professionnelles variées et qualité de vie méditerranéenne. La ville a connu une véritable renaissance ces dernières années, notamment depuis son année de Capitale européenne de la culture en 2013, avec la rénovation du Vieux-Port, l'ouverture du MUCEM et le développement de nombreux quartiers. Le coût de la vie y reste plus abordable qu'à Paris, tout en offrant les avantages d'une grande métropole. L'ambiance décontractée et l'accent chantant des Marseillais créent une atmosphère accueillante pour les nouveaux arrivants.",
        image: "marseille.png",
      },
      vie: {
        text: 'Marseille et sa métropole constituent <span style="font-weight: bold;color:#0063cb">le deuxième bassin économique de France</span> avec plus de 50 000 entreprises implantées sur le territoire.<ul><li>Le port de Marseille-Fos, premier port français et parmi les plus importants de Méditerranée, génère <span style="font-weight: bold;color:#0063cb">une activité considérable dans la logistique, le transport maritime et le commerce international</span>.</li><li>La ville accueille également <span style="font-weight: bold;color:#0063cb">un écosystème dynamique dans le numérique avec la French Tech</span> Aix-Marseille et des espaces comme La Belle de Mai ou Euroméditerranée qui hébergent de nombreuses startups.</li><li>Les secteurs traditionnellement forts incluent <span style="font-weight: bold;color:#0063cb">l\'aéronautique (Airbus Helicopters), la chimie, l\'énergie et la santé</span> avec de nombreux hôpitaux et laboratoires de recherche.</li><li><span style="font-weight: bold;color:#0063cb">Le tourisme</span> représente un pan majeur de l\'économie locale, créant des opportunités dans l\'hôtellerie, la restauration et l\'événementiel.</li><li><span style="font-weight: bold;color:#0063cb">Les services aux entreprises, le BTP, et les activités liées à l\'environnement et aux énergies renouvelables</span> se développent fortement. </li></ul>Pour les alternants, les opportunités sont diversifiées : grands groupes internationaux, PME familiales, associations et structures publiques recrutent régulièrement. Les chambres consulaires (CCI, CMA) proposent d\'ailleurs des bourses d\'alternance pour faciliter la mise en relation.',
        activites: [
          { naf_label: "Activités culturelles et festives", rome_codes: ["R1203", "R1204"] },
          { naf_label: "Numérique et nouvelles technologies", rome_codes: [] },
          { naf_label: "Aéronautique et spatial", rome_codes: [] },
          { naf_label: "Commerce et distribution", rome_codes: [] },
          { naf_label: "Tourisme et hôtellerie", rome_codes: [] },
        ],
      },
      mobilite: {
        text: 'Se déplacer à Marseille en tant qu\'alternant est relativement accessible grâce au réseau RTM (Régie des Transports Métropolitains) qui propose un abonnement jeune à tarif réduit (environ 35€/mois pour les moins de 26 ans).<br /><br />Le réseau comprend :<ul><li><span style="font-weight: bold;color:#0063cb">2 lignes de métro</span></li><li><span style="font-weight: bold;color:#0063cb">3 lignes de tramway</span></li><li>et <span style="font-weight: bold;color:#0063cb">plus de 80 lignes de bus</span> qui desservent l\'ensemble de la métropole.</li></ul>Le métro, bien que limité à deux lignes, permet de relier rapidement le centre aux quartiers périphériques et fonctionne jusqu\'à 0h30 en semaine.<br /><br /><span style="font-weight: bold;color:#0063cb">Le vélo se développe avec le système Le Vélo</span>, proposant vélos classiques et électriques en libre-service, même si le relief vallonné de certains quartiers peut être un défi. De nombreuses pistes cyclables ont été aménagées ces dernières années, notamment le long du littoral.<br /><br /><span style="font-weight: bold;color:#0063cb">La voiture reste pratique</span> pour accéder aux zones d\'activités périphériques comme les Pennes-Mirabeau ou Vitrolles, et le covoiturage est bien développé.<br /><br /><span style="font-weight: bold;color:#0063cb">Les trains TER permettent de rejoindre facilement Aix-en-Provence, Aubagne ou l\'étang de Berre</span> où se trouvent de nombreuses entreprises. Attention toutefois aux heures de pointe où la circulation peut être dense, notamment sur l\'autoroute urbaine.',
        transports: [
          { label: "2 lignes de métro", type: "metro" },
          { label: "3 lignes de tramway", type: "tramway" },
          { label: "Le Vélo", type: "velo" },
          { label: "La voiture", type: "voiture" },
          { label: "Bus", type: "bus" },
          { label: "TER", type: "train" },
        ],
      },
      logement: {
        text: 'Trouver un logement à Marseille demande de l\'anticipation mais reste plus accessible financièrement qu\'à Paris ou Lyon.<br /><br /><span style="font-weight: bold;color:#0063cb">Pour un studio, comptez entre 400€ et 600€ par mois</span> selon le quartier et l\'état du bien, tandis qu\'un T2 <span style="font-weight: bold;color:#0063cb">se situe généralement entre 550€ et 800€</span>.<br /><br />Les quartiers prisés par les alternants et étudiants incluent le 5ème arrondissement (Baille, Saint-Pierre), le 6ème (Castellane, Vauban, Notre-Dame du Mont) et certains secteurs du 1er et 7ème arrondissements, proches du centre et bien desservis. Le 4ème arrondissement, notamment autour de la Joliette et Euroméditerranée, se développe rapidement avec des logements neufs mais à des prix plus élevés.<br /><br /><span style="font-weight: bold;color:#0063cb">Les résidences étudiantes du CROUS proposent des chambres entre 300€ et 450€</span>, mais les places sont limitées et la demande forte. Plusieurs résidences privées pour étudiants et jeunes actifs (Studéa, Cardinal Campus) offrent des alternatives avec services inclus, à partir de 500€. Il est conseillé de commencer ses recherches dès avril-mai pour une rentrée en septembre, via les plateformes classiques (Leboncoin, SeLoger) et les groupes Facebook dédiés.<br /><br /><span style="font-weight: bold;color:#0063cb">Attention aux arnaques</span> : visitez toujours le logement avant de verser un quelconque acompte. Les aides au logement (APL) peuvent réduire significativement votre loyer, pensez à faire votre demande sur le site de la CAF dès votre installation.',
        loyers: [
          { type: "Studio", price_range: "400 - 600€" },
          { type: "T2", price_range: "550 - 800€" },
        ],
      },
      loisirs: {
        text: 'Marseille offre une richesse culturelle et des loisirs incomparables pour les alternants en quête d\'équilibre entre vie professionnelle et détente.<ul><li><span style="font-weight: bold;color:#0063cb">Les 57 kilomètres de littoral permettent de profiter des calanques</span>, véritables joyaux naturels accessibles en bus ou en bateau, parfaits pour la randonnée, l\'escalade ou la baignade.</li><li><span style="font-weight: bold;color:#0063cb">La vie culturelle est intense</span> avec le MUCEM, la Friche la Belle de Mai (tiers-lieu culturel incontournable), le Théâtre Silvain, et de nombreuses salles de concert comme Le Dome ou La Mesón.</li><li><span style="font-weight: bold;color:#0063cb">Les jeudis du port, les marchés de quartier et les événements comme la Fiesta des Suds ou le Festival de Marseille rythment l\'année</span>. Le Vieux-Port, le cours Julien (quartier alternatif et street-art) et la Plaine sont des lieux de rencontre privilégiés pour les étudiants et jeunes actifs.</li><li><span style="font-weight: bold;color:#0063cb">Les activités sportives sont nombreuses</span> : clubs de voile, plongée, football (avec l\'OM, véritable religion locale), escalade à Sormiou ou Luminy. </li><li><span style="font-weight: bold;color:#0063cb">La vie nocturne est animée avec des bars abordables</span> dans le centre-ville et des clubs en bord de mer. L\'ambiance marseillaise, authentique et chaleureuse, favorise les rencontres et l\'intégration rapide des nouveaux arrivants.</li></ul>',
        types: [
          { label: "57 km de littoral", type: "boat" },
          { label: "Vie culturelle", type: "concert" },
          { label: "Vie du port", type: "port" },
          { label: "Activités sportives", type: "sport" },
          { label: "Vie nocturne", type: "bar" },
        ],
      },
    },
  },
  {
    ville: "Toulouse",
    slug: "toulouse",
    geopoint: {
      lat: 43.604652,
      long: 1.444209,
    },
    content: {
      description_ville: {
        title: "la Ville Rose",
        text: "Toulouse, surnommée la &quot;Ville Rose&quot; en raison de ses briques de terre cuite caractéristiques, est la quatrième ville de France avec près de 500 000 habitants et plus d'un million dans sa métropole. Capitale de l'Occitanie, elle bénéficie d'un climat agréable du sud-ouest, d'une ambiance chaleureuse et d'un dynamisme économique remarquable. La ville accueille plus de 130 000 étudiants, ce qui en fait l'une des destinations préférées des jeunes en formation. Pour les alternants, Toulouse représente un terrain idéal : une économie tournée vers l'innovation, un coût de la vie raisonnable comparé à Paris, et une qualité de vie exceptionnelle. Entre la Garonne qui traverse la ville, les places animées du centre historique et les quartiers modernes comme Compans-Caffarelli, Toulouse offre un cadre de vie équilibré entre travail et détente. L'accent du sud-ouest, la convivialité des Toulousains et l'effervescence culturelle créent une atmosphère particulièrement accueillante pour les nouveaux arrivants. La ville est également bien connectée, avec un aéroport international et une gare TGV qui la relient facilement au reste de la France et de l'Europe.",
        image: "toulouse.png",
      },
      vie: {
        text: "<span style=\"font-weight: bold;color:#0063cb\">Toulouse est mondialement connue comme la capitale européenne de l'aéronautique et du spatial</span>, avec Airbus comme fleuron industriel employant des milliers de personnes. Le secteur aéronautique et spatial représente plus de 100 000 emplois directs et indirects dans la région, offrant d'innombrables opportunités d'alternance dans l'ingénierie, la production, la logistique ou encore le commerce.<br /><br />Au-delà de l'aérospatiale, <span style=\"font-weight: bold;color:#0063cb\">la ville s'est diversifiée avec un écosystème tech très dynamique</span> : les entreprises du numérique, de la cybersécurité, de l'intelligence artificielle et des biotechnologies sont en plein essor. Le quartier de Labège Innovation et la zone de Blagnac concentrent de nombreuses PME et start-ups innovantes.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">Les grands groupes comme Thales, Continental, Pierre Fabre ou Capgemini sont également présents et recrutent régulièrement des alternants</span>. La French Tech Toulouse soutient activement l'entrepreneuriat et l'innovation, créant un terreau fertile pour les jeunes talents.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">Les secteurs du conseil, de la banque-assurance</span> (Banque Populaire Occitane, Caisse d'Épargne) et du retail offrent aussi de belles perspectives. Les CCI, pôles de compétitivité et incubateurs facilitent les rencontres entre étudiants et entreprises lors de forums dédiés à l'alternance.",
        activites: [
          { naf_label: "Activités culturelles et festives", rome_codes: ["R1203", "R1204"] },
          { naf_label: "Numérique et nouvelles technologies", rome_codes: [] },
          { naf_label: "Aéronautique et spatial", rome_codes: [] },
          { naf_label: "Commerce et distribution", rome_codes: [] },
          { naf_label: "Tourisme et hôtellerie", rome_codes: [] },
        ],
      },
      mobilite: {
        text: "Se déplacer à Toulouse est relativement simple grâce au réseau Tisséo qui comprend deux lignes de métro automatique (A et B), deux lignes de tramway (T1 et T2), et un dense réseau de bus.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">Le métro est particulièrement pratique</span> pour relier rapidement le nord au sud et l'est à l'ouest de la ville, avec des stations comme Jean-Jaurès, Capitole ou Jeanne d'Arc qui desservent les principaux pôles d'activité. Un abonnement mensuel Pastel Étudiant coûte environ 10 euros pour les moins de 26 ans, ce qui est très avantageux pour les alternants.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">Le vélo est une option très prisée</span> : le service VélôToulouse propose des vélos en libre-service, et la ville a développé plus de 700 km de pistes cyclables. De nombreux alternants optent pour le vélo personnel ou électrique pour leurs trajets quotidiens, le climat toulousain s'y prêtant bien la majorité de l'année.<br /><br />Pour rejoindre les zones d'activité périphériques comme Labège, Blagnac ou Colomiers, <span style=\"font-weight: bold;color:#0063cb\">les lignes de bus Linéo et le réseau Arc-en-Ciel desservent efficacement la métropole</span>.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">La voiture reste utile pour certaines zones industrielles moins bien desservies</span>, et le covoiturage se développe activement. Toulouse dispose aussi d'un système d'autopartage (Citiz) pour les besoins occasionnels.",
        transports: [
          { label: "Réseau de métro Tisséo", type: "metro" },
          { label: "2 lignes de tramway", type: "tramway" },
          { label: "Bus", type: "bus" },
          { label: "VélôToulouse", type: "velo" },
          { label: "La voiture", type: "voiture" },
          { label: "Lignes Linéo et Réseau Arc-en-Ciel", type: "bus" },
        ],
      },
      logement: {
        text: '<span style="font-weight: bold;color:#0063cb">Trouver un logement à Toulouse demande de l\'anticipation, surtout pour les rentrées de septembre où la demande est forte.</span><br /><br />Pour <span style="font-weight: bold;color:#0063cb">un studio, comptez entre 400 et 550 euros</span> charges comprises selon le quartier et l\'état du bien, tandis qu\'un T2 oscille entre 550 et 750 euros, ce qui reste abordable comparé aux grandes métropoles françaises.<ul><li><span style="font-weight: bold;color:#0063cb">Les quartiers les plus prisés par les alternants</span> sont Saint-Michel et Arnaud-Bernard pour leur ambiance jeune et leurs prix encore accessibles, les Carmes pour sa centralité et son charme, ou Compans-Caffarelli pour sa modernité et sa proximité avec le campus universitaire.</li><li><span style="font-weight: bold;color:#0063cb">Les quartiers de Rangueil, Lardenne ou Croix-Daurade offrent des loyers plus modérés</span> tout en restant bien desservis par les transports.</li></ul>Pour faciliter vos recherches, utilisez les plateformes classiques mais aussi les groupes Facebook dédiés au logement étudiant à Toulouse, très actifs. <span style="font-weight: bold;color:#0063cb">Pensez aux résidences étudiantes privées</span> (Studéa, Nexity Studéa) qui proposent des studios meublés avec services, pratiques quand on arrive de l\'extérieur. <span style="font-weight: bold;color:#0063cb">Les résidences CROUS sont une option économique mais très demandée</span>, nécessitant une candidature précoce via le dossier social étudiant. En tant qu\'alternant, vous pouvez bénéficier des APL pour réduire votre loyer, et certains employeurs proposent une participation au logement dans le cadre du contrat d\'apprentissage.',
        loyers: [
          { type: "Studio", price_range: "400 - 550€" },
          { type: "T2", price_range: "550 - 750€" },
        ],
      },
      loisirs: {
        text: 'Toulouse offre <span style="font-weight: bold;color:#0063cb">une vie culturelle et festive exceptionnellement riche</span> pour les alternants qui souhaitent profiter de leur temps libre.<ul><li>Le quartier Saint-Pierre et la place Saint-Pierre concentrent de <span style="font-weight: bold;color:#0063cb">nombreux bars et restaurants où se retrouve la jeunesse toulousaine</span>, notamment en soirée et le week-end.</li><li>La place du Capitole, cœur battant de la ville, accueille régulièrement <span style="font-weight: bold;color:#0063cb">des événements, marchés et animations</span>, tandis que les berges de la Garonne, notamment la Prairie des Filtres, sont parfaites pour se détendre ou pique-niquer.</li><li>Les amateurs de culture apprécieront <span style="font-weight: bold;color:#0063cb">les nombreux musées (Musée des Augustins, Muséum, Fondation Bemberg), le théâtre du Capitole pour l\'opéra et le ballet, et la Cinémathèque pour les cinéphiles</span>. Côté festivals, Toulouse vibre au rythme de Rio Loco, du Marathon des Mots ou encore du Festival Séquence Court-Métrage.</li><li><span style="font-weight: bold;color:#0063cb">Les sportifs profiteront des installations municipales, des bords du Canal du Midi pour le jogging</span>, et pourront supporter le Stade Toulousain, club de rugby mythique.</li><li>La vie associative étudiante est très développée avec <span style="font-weight: bold;color:#0063cb">des centaines d\'associations culturelles, sportives et festives</span>. Le quartier Arnaud-Bernard, avec ses bars alternatifs et ses petits restaurants multiculturels, attire une population jeune et bohème, tandis que les clubs et discothèques du centre offrent des sorties nocturnes variées.</li></ul>',
        types: [
          { label: "Nombreux bars et restaurants", type: "bar" },
          { label: "Berges de la Garonne", type: "quai" },
          { label: "Nombreux lieux culturels", type: "concert" },
          { label: "Clubs et discothèques", type: "musique" },
          { label: "Stade Toulousain", type: "rugby" },
        ],
      },
    },
  },
  {
    ville: "Strasbourg",
    slug: "strasbourg",
    geopoint: { lat: 48.573405, long: 7.752111 },
    content: {
      description_ville: {
        title: "capitale européenne",
        text: "Strasbourg, capitale européenne et préfecture du Grand Est, offre un cadre de vie exceptionnel pour les alternants. Située à la frontière franco-allemande, cette ville de près de 280 000 habitants combine patrimoine historique et dynamisme économique. Son statut de capitale européenne, abritant le Parlement européen et le Conseil de l'Europe, lui confère une dimension internationale particulièrement attractive. La ville bénéficie d'un centre historique classé au patrimoine mondial de l'UNESCO, avec ses maisons à colombages et la majestueuse cathédrale. Strasbourg se distingue par son excellente qualité de vie, ses infrastructures modernes et son écosystème étudiant développé avec plus de 60 000 étudiants. Pour les alternants, c'est l'opportunité de vivre dans une ville à taille humaine, parfaitement connectée, où se mêlent cultures française et allemande. L'ambiance cosmopolite et la présence de nombreuses institutions européennes créent un environnement professionnel stimulant pour débuter sa carrière.",
        image: "strasbourg.png",
      },
      vie: {
        text: "Le tissu économique strasbourgeois est particulièrement diversifié et porteur d'opportunités pour les alternants.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">La ville s'impose comme un hub européen majeur</span> avec une forte présence d'institutions internationales, d'organisations européennes et d'ONG qui recrutent régulièrement des alternants dans <span style=\"font-weight: bold;color:#0063cb\">les domaines juridique, diplomatique et administratif</span>.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">Le secteur tertiaire</span> domine largement avec de nombreuses entreprises dans la banque, l'assurance et les services (Caisse d'Épargne, Crédit Mutuel, Groupama).<br /><br />Strasbourg excelle également dans <span style=\"font-weight: bold;color:#0063cb\">les sciences de la vie et la santé, avec des laboratoires pharmaceutiques et des centres de recherche biomédicale</span> reconnus. Le numérique et l'IT connaissent une croissance importante, notamment dans la cybersécurité et le développement web.<br /><br /><span style=\"font-weight: bold;color:#0063cb\">La proximité de l'Allemagne favorise les échanges commerciaux et multiplie les opportunités</span> dans les entreprises franco-allemandes. Le tourisme, l'hôtellerie-restauration et le secteur culturel offrent aussi de nombreux contrats d'alternance. Les pôles de compétitivité comme Alsace BioValley ou le pôle Véhicule du Futur dynamisent l'innovation locale.",
        activites: [
          { naf_label: "Activités culturelles et festives", rome_codes: ["R1203", "R1204"] },
          { naf_label: "Numérique et nouvelles technologies", rome_codes: [] },
          { naf_label: "Aéronautique et spatial", rome_codes: [] },
          { naf_label: "Commerce et distribution", rome_codes: [] },
          { naf_label: "Tourisme et hôtellerie", rome_codes: [] },
        ],
      },
      mobilite: {
        text: '<span style="font-weight: bold;color:#0063cb">Se déplacer à Strasbourg est remarquablement facile</span>, ce qui représente un atout majeur pour les alternants jonglant entre entreprise et école. La ville dispose d\'un excellent réseau de tramway (6 lignes) géré par la CTS, qui dessert efficacement tous les quartiers et zones d\'activité, avec des passages fréquents de 5h à minuit. Le réseau de bus complète parfaitement le tram avec plus de 30 lignes, dont certaines nocturnes le week-end.<br /><br /><span style="font-weight: bold;color:#0063cb">Strasbourg est la capitale française du vélo avec plus de 600 km de pistes cyclables</span> et le service Vélhop qui propose vélos classiques et électriques en location. La ville est relativement compacte, permettant de traverser le centre en 20 minutes à vélo.<br /><br />L\'abonnement mensuel CTS coûte environ 30€ pour les moins de 28 ans, un tarif très avantageux.<br /><br /><span style="font-weight: bold;color:#0063cb">Pour rejoindre d\'autres villes, la gare centrale offre des connexions TGV</span> vers Paris (1h45), Lyon, Marseille et des trains régionaux vers l\'Allemagne. Le stationnement automobile est coûteux en centre-ville, rendant la voiture peu nécessaire au quotidien.',
        transports: [
          { label: "Tramway (6 lignes)", type: "tramway" },
          { label: "Bus (30 lignes)", type: "bus" },
          { label: "Capitale du vélo", type: "velo" },
          { label: "600 km de pistes cyclables", type: "trottinette" },
          { label: "Gare SNCF", type: "tgv" },
        ],
      },
      logement: {
        text: 'Trouver un logement à Strasbourg demande de l\'anticipation, mais reste plus accessible que dans les grandes métropoles françaises.<br /><br /><span style="font-weight: bold;color:#0063cb">Le loyer moyen pour un studio se situe entre 400€ et 550€</span> charges comprises, tandis qu\'un T2 coûte généralement entre 600€ et 800€ selon le quartier et l\'état du bien.<br /><br /><span style="font-weight: bold;color:#0063cb">Les quartiers les plus prisés</span> par les alternants sont la Krutenau (ambiance étudiante, proximité du centre), le Neudorf (bien desservi, plus calme), l\'Esplanade (campus universitaire, résidences étudiantes), et Meinau (prix plus abordables). Le quartier de la gare et celui de l\'Étoile offrent un bon compromis entre accessibilité et budget.<br /><br /><span style="font-weight: bold;color:#0063cb">Les résidences CROUS proposent des logements de 250€ à 400€</span>, mais sont difficiles à obtenir pour les alternants. Les plateformes comme Studapart, LeBonCoin ou les agences immobilières locales sont les principaux canaux de recherche.<br /><br />Il est recommandé de <span style="font-weight: bold;color:#0063cb">constituer un dossier solide avec garant et de commencer ses recherches 2 à 3 mois avant la rentrée</span>. Les aides au logement (APL) permettent généralement de réduire le loyer de 100€ à 200€ selon les ressources.',
        loyers: [
          { type: "Studio", price_range: "400 - 550€" },
          { type: "T2", price_range: "600 - 800€" },
        ],
      },
      loisirs: {
        text: "Strasbourg propose une offre culturelle et de loisirs exceptionnelle qui permet aux alternants de profiter pleinement de leur temps libre.<br /><br />La ville vibre au rythme de nombreux festivals comme le célèbre Marché de Noël (le plus ancien de France), les Artefact ou encore le festival de musique électronique Ososphère.<br /><br />Les amateurs de culture peuvent profiter de l'Opéra national du Rhin, du Théâtre national de Strasbourg, et de nombreux cinémas dont le mythique Odyssée.<br /><br />La vie étudiante est très animée dans le quartier de la Krutenau et autour de la place Saint-Étienne, avec bars, pubs et clubs pour tous les goûts.<br /><br />Le parc de l'Orangerie, le jardin des Deux Rives et les bords de l'Ill offrent des espaces verts parfaits pour se détendre.<br /><br />Les sportifs apprécieront les installations universitaires, les salles d'escalade, les piscines et la possibilité de faire du kayak sur l'Ill. La proximité de l'Allemagne permet des sorties à Kehl ou Baden-Baden, tandis que les Vosges, à 30 minutes, offrent randonnée l'été et ski l'hiver.",
        types: [
          { label: "Marché de Noël", type: "shopping" },
          { label: "Festivals", type: "musique" },
          { label: "Vie étudiante animée", type: "bar" },
          { label: "Randonnée et ski", type: "ski" },
          { label: "Sport", type: "sport" },
          { label: "Parcs et jardins", type: "promenade" },
        ],
      },
    },
  },
  { ville: "Nantes", slug: "nantes", geopoint: { lat: 47.218371, long: -1.553621 }, content: {} },
  { ville: "Rennes", slug: "rennes", geopoint: { lat: 48.117266, long: -1.677793 }, content: {} },
  { ville: "Montpellier", slug: "montpellier", geopoint: { lat: 43.611667, long: 3.877222 }, content: {} },
  { ville: "Lille", slug: "lille", geopoint: { lat: 50.62925, long: 3.057256 }, content: {} },
  { ville: "Grenoble", slug: "grenoble", geopoint: { lat: 45.188529, long: 5.724524 }, content: {} },
]
