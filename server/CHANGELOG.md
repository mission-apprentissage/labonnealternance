# CHANGELOG

## 1.20.9 [27/09/2022]
[LBAC-329] Fix bug choix de recherche par nom de diplôme
[LBAC-300] Import Catalogue en utilisant le endpoint /formations.json
[LBAC-324] Import uniquement des champs du catalogue dont nous avons besoin
[LBAC-289] Toggles visibles sur les bouchons
[LBAC-332] Ajout bloc Aidez-nous

## 1.20.8 [22/09/2022]
[LBAC-328] Fix CSP pour safari
[LBAC-330] Mise à jour de nodejs

## 1.20.7 [15/09/2022]
[LBAC-302] Correction détection tests swagger inter environnements
[LBAC-298] Fix zoom après première recherche
[LBAR-617] Modification endpoint "intitule"
[LBAC-67] Automate d'anonymisation des candidatures
[LBAC-269] Eligible Handicap
[LBAC-299] Fix responsive widget postuler

## 1.20.6 [07/09/2022]
[LBAC-265] Enrichissement info entreprises anonymes et mandatées
[LBAC-294] Enrichissement description offres mandatées
[LBAC-277] Headers CSP
[LBAC-278] Paramétrage fin du côté frammable du site
[LBAC-255] Ajouter boutons de MAJ de l'offre LBA dans le mail Je candidate recruteur
[LBAC-248] Découper la FAQ en 3 onglets
[LBAC-267] Enseigne Matcha 
[LBAC-43] Message catalogue vide
[LBAC-179] Clarifier l'adresse des CFA mandatés
[LBAC-289] Bouchonner Matcha Mandatée
[LBAC-259] Bug autocomplete pas fixé

## 1.20.5 [26/08/2022]
[LBAC-199] Affichage messages 0 formation
[LBAC-89] Fix erreur diplômes
[LBAC-259] Fix via memoization requêtes romes
[LBAC-70] Scan antivirus des PJs
[TECH] Amélioration docker
[LBAC-47] Bouchonner Matcha
[LBAC-261] Lien LinkedIn
[LBAC-260] Compteurs dans la liste des résultats
[LBAC-234] Expliquer l'algorithme

## 1.20.4 [03/08/2022]
[LBAC-109] Tracking événements pour plausible
[LBAC-207] Next 12 et React 18
[LBAC-208] MAJ page stats
[LBAC-258] Promotion de la FAQ
[LBAC-245] Ajout domaine recherché dans consultation de fiche

## 1.20.3 [19/07/2022]
[LBA6-241] Affichage email crypté pour tous les appelants
[LBA6-122] Fix import fichier SAVE
[LBA6-21] Augmentation quota api candidature
[LBA6-179] CFA mandates
[LBA6-130] Ecarts Figma-prod
[LBA6-130] Bouton retour à la liste
[LBA6-197] appariement
[LBA6-225] Téléphone cliquable
[LBA6-252] Normalisation nom La bonne alternance
[LBA6-194] FAQ sur Notion

## 1.20.2 [28/06/2022]
[LBA6-177] Fix centrage sur éléments sur mobile
[LBA6-104] Appariement offre formation-emploi
[LBA6-21] Ouverture API envoi de candidature
[LBA6-20] Fix conflit d'autocomplétion

## 1.20.1 [16/06/2022]
[LBA6-175] Désactivation mesure d'intérêt offre mandataire
[LBA6-182] Ajustements textes et masquage bloc partenaires
[LBA6-179] Amélioration de la géolocalisation

## 1.20.0 [14/06/2022]
[LBA6-137] Intégration nouvelle page accès recruteur
[LBA6-136] Intégration nouvelle page organisme de formation
[LBA6-105] Réintégrer le bloc explicatif des CFA d'entreprise
[LBA6-10] France-relance dans le footer

## 1.19.2 [09/06/2022]
[LBA6-17] Mail envoyé au candidat (matcha ou candidature spontanée)
[LBA6-161] Reste à faire sur les fiches détaillées
[LBA6-176] Fix non chargement map sur mobile

## 1.19.1 [07/06/2022]
[LBA6-126] Gestion des erreurs 429 pour les candidatures
[LBA6-45] Bouchons appels vers apis formations
[LBA6-128] Refonte fiche détaillée, reliquats

## 1.19.0 [22/05/2022]
[LBA6-68] Remplacement redux par API context
[LBA6-36] Fix effect de rechargement sur lien Organisme de formation
[LBA6-12b] MAJ email envoyé au recruteur lors d'une candidature spontanée, reliquats
[LBA6-11b] MAJ email envoyé au recruteur lors d'une candidature Matcha, reliquats

## 1.18.12 [17/05/2022]
[LBA6-132] Corrections en-têtes des fiches détails
[LBA6-131] Scrolling vers les offres cassé
[LBA6-135] Restauration info métier Matcha
[LBA6-11] MAJ email envoyé au recruteur lors d'une candidature Matcha
[LBA6-12] MAJ email envoyé au recruteur lors d'une candidature spontanée
[LBA-99] MVP appariement offre emploi - formation

## 1.18.11 [11/05/2022]
[LBA6-32] Contrôle des emails des candidats : pas d'email temporaire
[LBA6-110] Récupération du flag établissement mandataire
[LBA6-32] Proposition fautes de frappes emails
[LBA6-51] Formation : Refonte fiche détaillée
[LBA6-26] Formation : Refonte fiche détaillée entreprise
[LBA6-127] Refonte page stats
[LBA6-32] Limitation nombre de candidatures par jour
[LBA6-112] Events plausible
[LBA6-32] Proposition fautes de frappes emails
[LBA6-99] Infos CFA mandataire

## 1.18.10 [21/04/2022]
[LBA6-49] Api-doc opco
[LBA6-18] Essai Plausible
[LBA6-53] Récupération du fichier des SIRENs Akto
[LBA6-52] Matchas avant offres PE dans tous les cas
[LBA6-30] Séparation traitement suppressions SAVE du traitement du fichier principal
[LBA6-60] Prise en compte des romes supprimés via SAVE

## 1.18.9 [14/04/2022]
[1008] Blacklister les emails bloqués sur sendinblue
[1110] Cryptage email pour 1j1s

## 1.18.8 [08/04/2022]
[1153] Fix mauvaises positions régions et départements
[1152] Reliquats MEP e-mails
[1103b] Reliquats onglets
[1149] Superposition de blocs
[1150] Désactivation Tag Commander selon la source
[1103] Màj CSS onglets
[1137] Màj de la page de test du widget
[1151] changement route catalogue

## 1.18.7 [31/03/2022]
Ajout information entreprise & offre Matcha
[1145] Fix emails à "null"
[1102] Correction breakpoint CSS
[1047] Nouveau bloc Home
[1072] Maj Rencontrer le candidat
[1075] Ecran de confirmation - vocabulaire
[1084] Cas de refus pr le candidat
[1142] Offres Matcha avant offres PE

## 1.18.6 [18/03/2022]
[1136] Fix bouton retour au formulaire sur widget emploi
[1128] Fix call api PE France entière sans radius
[1141] Fix accès aux offres Matcha 

## 1.18.5 [10/03/2022]
[1066] Recherche France entière
[1116] Fix accès par ID fiches formations
[1127] Endpoint mise à jour téléphone Bonne Boîte
[1107] Filtrage par Opco
Amélioration du retour des intitulés ROME pour Matcha

## 1.18.4 [08/03/2022]
Ajout d'une route sur l'intitulé ROME
Ajout du détail du code ROME sur les offres Matcha
Endpoint mise à jour email Bonne Boîte

## 1.18.3 [23/02/2022]
Adaptation script pour SAVE update

## 1.18.2 [22/02/2022]
[1114] Plusieurs types de contrat pour Matcha
[1113] Affichage CFA d'entreprise aussi pour siret gestionnaire

## 1.18.1 [07/02/2022]
Affinage score d'affichage CBS
[1053] Notification sur slack
[1069] Type lba par défaut sur l'import lbb
[1071] Fix bug boutons multiples PRDV
[924] Masquer contact si bouton PRDV
[1059] Mauvais onglet ouvert après navigation
[1025] Rechercher des villes avec arrondissements
[1024] Astuces : supprimer la mesure d'utilité
[1092] Fix anomalies d'affichage ligne insécable trop longue
[1068] Optimisation import formations
[1097] Fix boutons sur cartes
[1100] Mails lbb

## 1.18.0 [31/01/2022]
[992] Utilisation elasticsarch lbb
[1028] Volume vers point de montage datalake
[903b] Reliquat "j'envoie ma candidature"
[954] Ouvrir dans un nouvel onglet les formations

## 1.17.10 [27/01/2022]
[1020] Paramètre sur domaineMetiers pour liste les couples romes/labels
[1031] Limitations endpoint application
[1041] Formations affichées en premier

## 1.17.9 [18/01/2022]
[999] Ignorer les webhooks sur emails notifications aux candidats
[985] Prise en compte data SAVE pour import LBB
[1021] Ajout d'un endpoint sécurisé sur les applications
[981] Afficher les entreprises en premier
[982] Utilisation champ cle_ministere_educatif pour identifier les formations en accès direct
[1023] Mise en commentaire du champ periode

## 1.17.8 [06/01/2022]
[905] Notifier retour société aux candidats
[903] Ne plus afficher "j'envoie ma candidature" si déjà fait.

## 1.17.7 [03/01/2022]
[920] hooks sendinblue

## 1.17.6 [25/12/2021]
[967] ordre affichage offres d'emploi
[969] Cas d'erreur candidature
[985] Optimisation réindexation de masse
[983] Fix enum champ parcoursup_statut
[944] Suppression avis candidat

## 1.17.5 [16/12/2021]
[956b] reliquats footer
[976] fix détection contexte header

## 1.17.4 [14/12/2021]
[914] Scripts import LBB
[956] Marianne header/footer
[943] Reliquats Astuces
[369] Recherche plus robuste
[966] Nouveau champ catalogue

## 1.17.3 [26/11/2021]
[832] Astuces

## 1.17.2 [22/11/2021]
[921] Finitions mep
[888] Bloquer la fermeture de popin
[879] Màj email de contact
[906] Avis candidat
[906] Intention recruteur

## 1.17.1 [10/11/2021]
[902] CGU sans case à cocher
[910] Restauration boutons
[893] Obfuscation de l'adresse email LBA/LBB
[885] Dissociation scripts update du catalogue
[884] Exploitation des Bonnes boîtes LBB
[912] Formulaire candidature Matcha : mail candidat
[913] Cryptage adresse email et random IV
[825] Affichage nom société dans le modèle de candidature spontanée

## 1.17.0 [18/10/2021]
[793] Envoi d'une candidature spontanée

## 1.16.7 [14/10/2021]
[833] Wording

## 1.16.6 [06/10/2021]
[815] Réduction du nombre de pages générées pour le SEO
[855] Remontée des champs Matcha type et début de formation
[862] Affichage nouveaux champs Matcha

## 1.16.5 [23/9/2021]
[817] Design remerciement
[815] Réduction génération SEO
[837] Masquage siret offre PE

## 1.16.4 [20/09/2021]
[829] Fix import formations par job
[802] Nouveaux paramètres api métiers
[741] Suppression lien crédit photo
[762-777] Wording

## 1.16.3 [13/09/2021]
[808] Tagco à implémenter sur la page cookies
[812] Màj code google site verification
[770] Réordonnancer liens footer

## 1.16.2 [09/09/2021]
[759] Mise à jour liste des cfas d'entreprise
[787] Bug itinéraire
[806] Métier positionné avant diplôme pour la recherche

## 1.16.1 [07/09/2021]
[749] Mise en conformité RGPD
[772] Internalisation ES catalogue + import
[781] Exposition api search sur l'es catalogue

## 1.16.0 [25/08/2021]
[744] Recherche par diplôme : alimentation de la base
[745] Recherche par diplôme : remontée des résutats de recherche
[746] Recherche par diplôme : présentation du champ de recherche avec séparations par titre
[747] Recherche par diplôme : recherche de formations/métiers sur la base d'un diplôme
[748] Recherche par diplôme : utilisation urls directes
[783] Bug de parenthèses dans la recherche de domaine métiers
[784] Tracking recherche métier vs. diplôme

## 1.15.13 [25/08/2021]
[774] Se souvenir des actions d'un utilisateur lors d'une session
[709] Correction bug responsive design

## 1.15.12 [19/08/2021]
[705] Vérification des balises meta et title de chaque page
[726][727] Memoization pour limiter des appels redondants
[761] Erreurs catalogue HS non bloquantes
[758] SEO des titres du catalogue
[682] Sur les détails, positionner une question "allez-vous contacter cet établissement ?"

## 1.15.11 [17/08/2021]
[715] Catalogue de liens
[719] Sitemap avancé

## 1.15.10 [21/07/2021]
[743] Fix recherche sur map
[695] Didask : Formations
[751] Marges latérales écran de détail LBB
[750] Didask : Intégration Capsules recherche employeur + préparation entretien employeur

## 1.15.9 [19/07/2021]
[736] Correction récupération détail lbb avec score alternance 0
[707] Conservation des résultats de recherche dans l'historique navigateur
[740] Conservation des query parameters utm_

## 1.15.8 [07/07/2021]
[715] Catalogue
[724] Augmentation de quota

## 1.15.7 [06/07/2021]
[708] Adaptation script d'export test ARA
[716] Sitemap
[528] Ouverture publique API Matcha

## 1.15.6 [21/06/2021]
[700] Changement lien matcha
[673] Ajustements homepage
[565] Bloc info homogène
[680] Explication CFA d'entreprise
[694] Remplacement de la police Inter par la police Marianne
[699] Utilisation du protocole HTTP2
[691] Historique et accès direct sur liens de recherche

## 1.15.5 [15/06/2021]
[563] Màj api-docs
[427] Script génération de liens widgets selon profil DE de Pôle emploi
[681] Lien vers l'itinéraire

## 1.15.4 [10/06/2021]
[687] Update tracking ouvertures fiches avec itemId
[669] Affinage remontées Sentry
[684] Rollback tri apis 
[591] Nouvelle charte popin formation
[630] Bloc matcha page "recruteur"
[628] Redesign fiche Matcha

## 1.15.3 [08/06/2021]
[639] Changement de texte CTA principal
[638] Select "niveau d'études" plus petit
[608] Spinner LBF
[633] Mise en avant des éléments de la popup ouverte dans la liste principale
[664] Fix scroll to autocomplétion
[658] Modification des tris de requêtes PE
[666] Chargement d'emplois sur acccès direct à fiche formation
[670] Fix appel bonne boîte LBA
[638b] Taille "niveau d'études" 
[662] Enregistrer en base les appels API

## 1.15.2 [27/05/2021]
[643] Icône plus grosse au clic sur la map
[646] Infos de contact pour 1j1s pour endpoint fiche lba
[645] Masquage infos contact sur api-docs
[637] Couleurs de la nouvelle home : ajustements
[649] Utilisation recette matcha 

## 1.15.1 [25/05/2021]
[640] Infos de contact pour 1j1s
[641] Simplification clefs de recherche pour niveau de formation
[636] Fix ortho
[623] Fix typo et tracking

## 1.15.0 [21/05/2021]
[566a] Icône plus large pour représenter l'élément sélectionné
[592] Nouvelle home
[634] Gestion mise en avant sur la map au survol des éléments dans la liste

## 1.14.3 [20/05/2021]
[623] ...Tracking affichage des fiches détail
[588] Fix state voir les infos de contact
[502] Suppression dédoublonnage cfa en précisant la ville

## 1.14.2 [19/05/2021]
[626] Fix bug liste des diplômes
[623] Tracking des affichages prdv, ...

## 1.14.1 [18/05/2021]
[622] API métiers par établissement
[551] Récupération code_commune_insee pour les formations
[564] Suppression bandeau apprentissage seulement
[625] Fix bug page test-widget 

## 1.14.0 [07/05/2021]
[559] Statut autocomplete
[519] Tag CFA d'entreprise
[420] Réorganisation table domaines/métiers

## 1.13.4 [07/05/2021]
[595] tracking gtm
[579] Suppression notion de poids sur les opportunités d'emploi

## 1.13.3 [05/05/2021]
[610] Envoi event vers catalogue à l'affichage d'une formation
[515] Page tampon accès recruteur

## 1.13.2 [05/05/2021]
[609] Masquage sessions déjà commencées, meilleure présentation formations

## 1.13.1 [04/05/2021]
[589] Exploitation geoloc catalogue améliorée pour LBA

## 1.13.0 [30/04/2021]
[576] Descriptions des formations LBF
[601] Intégration détail LBF

## 1.12.3 [29/04/2021]
[441] Le saviez-vous : changement de design
[523] Corrections page "à propos"
[584] Emission d'events google analytics via data layer

## 1.12.2 [23/04/2021]
[550b] Correction RGPD
[523] A propos, modifications
[575] Affichage formation non éligible
[590] Paramètre id rco pour prdv

## 1.12.1 [16/04/2021]
[571] Ajout code postal pour PRDV
[543] Fiche détail : faire disparaître la navbar
[539] Positionnement et wording des offres liées au département
[568] Tag matcha, lieu PE ok
[556] réorganisation du Dom

## 1.12.0 [16/04/2021]
[311] Recherche depuis la carte
[550] Changement de texte RGPD
[545] Bouton "Je postule" en fixe

## 1.11.3 [13/04/2021]
[536] Remplacement gtm par tagcommander
[537] Bordure icône job

## 1.11.2 [12/04/2021]
[524] Coupure des appels à l'api LBB
[497] domainesMetiers retourne les codes RNCPs

## 1.11.1 [09/04/2021]
[537] Changement de couleurs
[382] Ajout des contrats pro dans les offres Pôle emploi

## 1.11.0 [08/04/2021]
Récupération des offres Matcha
[544] Nouveaux pictogrammes précédent / suivant
[529] Positionner tags

## 1.10.8 [06/04/2021]
[514] Maj CGU et liens footers
[546] Hotfix liens contacts en blanc sur blanc

## 1.10.7 [02/04/2021]
[517] Reliquats 404 et 500
[535] Changement de nom du fichier widget prdv

## 1.10.6 [01/04/2021]
[509] Swipe et scroll
[330] Optimisations et nettoyage
[518] Classe GMT sur bouton PRDV

## 1.10.5 [23/03/2021]
[348] Page d'erreur 500
[513] Filtre selon état de publication

## 1.10.4 [18/03/2021]
[490] Déplacer les crédits d'illustrations
[347] Nouvelle charte page d'erreur
[495] Fix caractères spéciaux dans les liens google
[494] Classe GTM lien google
[408] Classe GTM lien contact PE

## 1.10.3 [16/03/2021]
[486] Fix messages d'erreurs techniques sur formulaires
[487] Bouton reset message d'erreur
[422] Lien de recherche Google
[468] Style messages d'erreurs champs de formulaires
[425] Style input
[217] Navigation par tabulation dans les popups 
Généralisation bouton prdv

## 1.10.2 [12/03/2021]
[477] Couleur spinner
[428] Breadcrumb
[476] Supprimer lien "en savoir plus" sur mobile
[473] Voir les informations de contact, restyler
[478] Fix bande blanche à droite sur map
[479] Map statique tronquée
[480] Largeur mapbox réduite sur mobile
Meilleur centrage boutons flottants

## 1.10.1 [11/03/2021]
[465] Image recherche
[469] Dropshadow
[359] Corrections footer
[464] Ajout de la localité du CFA pour discriminer les quasi doublons
[461] Corrections design
[460] Zoom dézoom de la carte au pinch
[457] Accès direct aux fiches LBB / LBA

## 1.10.0 [09/03/2021]
[354] Nouvelle grille de composants, formulaire dans head
[431] Navigation via historique
[358] Lien direct vers fiches offre et formation

## 1.9.3 [19/02/2021]
[419] Gestion cas "vides" sur champ d'auto complétion
Renommmage /statistiques vers /stats

## 1.9.2 [18/02/2021]
[417] Restauration de la home

## 1.9.1 [18/02/2021]
Fix des tests avec nock.enableNetConnect

## 1.9.0 [16/02/2021]
[362] Option métier figé sur widget

## 1.8.8 [15/02/2021]
[407] Gestion erreur accès au catalogue

## 1.8.7 [12/02/2021]
[388] Endpoint d'injection du fichier domainesMetiers

## 1.8.6 [11/02/2021]
[363] Charter les messages d'info

## 1.8.5 [10/02/2021]
[386] Rechargement carte après navigation navigateur
[392] Fix bug scroll vers offre PE
[395] Empêcher le rechargement de page au dépassement de scroll sur mobile

## 1.8.4 [08/02/2021]
[381] Ajustements nouvelle charte

## 1.8.3 [05/02/2021]
[322] étendre la sélection, classes gtm
[349] Nouvelle charte onglets
[387] Bannière apprentissage seulement
Ajout infos de contact Lbb/Lba et suppression lien vers fiche externe lbb/lba

## 1.8.2 [04/02/2021]
[381] Nouvelle charte, corrections

## 1.8.1 [02/02/2021]
[371] Utilisation API Catalogue ES au lieu d'accès direct
[351c] Sticky Navbar sur l'écran de détail
[351] Rechartage formation et entreprise LBB

## 1.8.0 [01/02/2021]
[377] Bascule sur le catalogue 2021

## 1.7.1 [29/01/2021]
[373] Fix clignotement sur le formulaire

## 1.7.0 [28/01/2021]
[366] Rappatrier ES domainesMetiers

## 1.6.1 [25/01/2021]
[360] Augmentation des quotas de requêtes sur la conf nginx

## 1.6.0 [25/01/2021]
[346] Adaptation fond de carte et pictos de carte

## 1.5.1 [22/01/2021]
[344] Recharter peJob.js

## 1.5.0 [22/01/2021]
[343] Recharter Training.js

## 1.4.3 [21/01/2021]
[342] Fix zoom sur centre de recherche pour widget /recherche-emploi

## 1.4.2 [21/01/2021]
[273] Addendum FAQ

## 1.4.1 [21/01/2021]
[277] Mise à jour du footer

## 1.4.0 [20/01/2021]
Chargement de mapbox seulement lorsque nécessaire

## 1.3.4 [18/01/2021]
Ajustements recherche domainesMetiers : plus de résultats, ignore les mots courts sur une recherche multimots à partir du deuxième mot

## 1.3.3 [15/01/2021]
[274] Ajustements home

## 1.3.2 [15/01/2021]
[291] Fix rayon de recherche LBB/LBA

## 1.3.1 [14/01/2021]
[291] Fix rayon de recherche LBB/LBA

## 1.3.0 [14/01/2021]
[303] Ajouter la route swagger.json

## 1.2.1 [14/01/2021]
[329] Spinner pour les widgets

## 1.2.0 [11/01/2021]
[262] Widget emploi

## 1.1.7 [08/01/2021]
[319] Utilisation intitule_long pour noms de formations

## 1.1.6 [08/01/2021]
Fix variable evt Sentry
Page /config pour connaître l'evt sans passer par /api

## 1.1.5 [08/01/2021]
[309] Chartage autocomplétion

## 1.1.4 [07/01/2021]
[305] Reliquats

## 1.1.3 [07/01/2021]
[316] Recherche multi mots sur domainesMetiers
[300] Utilisation de domainesMetiers sur tables-correspondances

## 1.1.2 [05/01/2021]
[296] Message d'erreur technique mal calibré
Fix config es
Utilisation config côté ui pour sentry

## 1.1.1 [04/01/2021]
[216] Enrichissement informations remontées pour API formations
Modification de l'initialisation des curseurs Elastic Search

## 1.1.0 [18/12/2020]
[240] Home : services

## 1.0.1 [18/12/2020]
[274] Se former et travailler

## 1.0.0 [18/12/2020]
V1 :)

## 0.14.3 [18/12/2020]
[294] Styleguide à jour

## 0.14.2 [17/12/2020]
[274d] Fix lien stats

## 0.14.1 [17/12/2020]
[274c] Ajustements typo et style

## 0.14.0 [17/12/2020]
[288] Page à propos

## 0.13.0 [17/12/2020]
[243] Page RGPD

## 0.12.0 [17/12/2020]
[274b] Corrections de présentation, favicon
[245] Page accessibilité

## 0.11.1 [16/12/2020]
[274] Hover

## 0.11.0 [16/12/2020]
[279] Ajout Analytics

## 0.10.2 [16/12/2020]
[281] Fix bug emploi qui ne remontent pas sur la map

## 0.10.1 [16/12/2020]
[274a] Corrections de présentation 

## 0.10.0 [16/12/2020]
[280] Ajout Sentry

## 0.9.5 [16/12/2020]
[227] Corrections css portage vers version nextjs

## 0.9.4 [15/12/2020]
[276] Scrolltops sur les pages et réduction logos sponsors

## 0.9.3 [15/12/2020]
[278] Appel des routes API depuis LBA PE

## 0.9.2 [14/12/2020]
[228] Adaptation pour next.js du widget 

## 0.9.1 [11/12/2020]
[158] Accès Organisme de formation changement de chemin de la page 

## 0.9.0 [11/12/2020]
[158][FEATURE][DESIGN] Accès Organisme de formation

## 0.8.0 [11/12/2020]
[244][FEATURE][DESIGN] FAQ

## 0.7.2 [11/12/2020]
[272] Balises dans le Head

## 0.7.1 [11/12/2020]
Scripts de lancement adaptés pour Nextjs

## 0.7.0 [10/12/2020]
[241] Nouvelle home : bloc mission apprentissage

## 0.6.1 [10/12/2020]
Retrait du bouton d'essai prise de rendez-vous

## 0.6.0 [09/12/2020]
[242] Footer

## 0.5.0 [08/12/2020]
[238] Formulaire de démarrage et navigation vers et depuis les résultats 

## 0.4.0 [04/12/2020]
[237] Home hero improved 

## 0.3.0 [04/12/2020]
[236] Home header

## 0.2.1 [04/12/2020]
[226] Tracker les mots clefs de métiers cherchés

## 0.2.0 [03/12/2020]
[233] Styleguide

## 0.1.1 [03/12/2020]
[234] Tracker les mots clefs de métiers cherchés

## 0.1.0 [03/12/2020]
[172] SSR avec NextJS

## 0.0.28 [27/11/2020]
[214] Fix pastilles entreprises manquantes

## 0.0.27 [27/11/2020]
[213] Fix recherche en Corse

## 0.0.26 [26/11/2020]
[203] Enrichissement des logs applicatifs

## 0.0.25 [24/11/2020]
[200] Identification des consommateurs d'API via tracking system

## 0.0.24 [23/11/2020]
[198] Masquage coordonnées de contact des sociétés LBA / LBB pour les appels à l'api par des tiers

## 0.0.23 [21/11/2020]
[199] Retour d'erreur précis si utilisation d'un rome inconnu pour les appels à l'api lbb

## 0.0.22 [19/11/2020]
[194] Fix bug de recherche sur le métier commerce

## 0.0.21 [19/11/2020]
[191] Upgrade node 14

## 0.0.20 [19/11/2020]
[BSR] Suppression des ApiTesters inutilisés

## 0.0.19 [19/11/2020]
Pre-commit

## 0.0.18 [17/11/2020]
[170-b] Branchement Github actions avec infra

## 0.0.17 [17/11/2020]
[170] Github actions
Utilisation de main comme branche de production

## 0.0.16 [17/11/2020]
Fakefeature prise de rendez-vous
Prettier
Fix dédoublonnage
Fix tests

## 0.0.15 [13/11/2020]
[130][131][Server][Back] Dédoublonnage des formations 

## 0.0.14 [13/11/2020]
[169][UI][Front] Fix clignotement sur desktop width<768px

## 0.0.13 - 13-11-2020
[179][Server][Front] Versionning

## 0.0.12 (12/11/2020)
[321][Server] limitation du nombre de requêtes par seconde

## 0.0.11 (12/11/2020)
[337][UI] temporisation clavier

## 0.0.10 (06/11/2020)
[#164] Bouton prise de RDV

## 0.0.9 (02/11/2020)
[#299] Doc swagger des api
- /api/V1/formationsParRegion
- /api/V1/jobs
- /api/V1/jobsEtFormations

## 0.0.8 (30/10/2020)
[#299] Doc swagger des api - /api/V1/formations

## 0.0.7 (29/10/2020)
[#336] Recherche formations et emplois sur une seule route

## 0.0.6 (26/10/2020)
[#301] Recherche formation sur département

## 0.0.5 (23/10/2020)
[#305] Recherche de formations sur un grand domaine (ex: A ou A10 en alternative à une liste de codes romes)

## 0.0.4 (23/10/2020)
[#335] Un seul objet params pour fonctions API (remplace plusieurs params)

## 0.0.3 (22/10/2020)
[#314] Gestion d'erreur globale

## 0.0.2 (16/10/2020)
[#284b] Cas d'erreur du fetchDiplomas, correctifs

## 0.0.1 (15/10/2020)
[#284] Cas d'erreur du fetchDiplomas
