import { IRawRHAlternanceJob } from "shared/models/rawRHAlternance.model"

export const generateRawRHAlternanceJobFixture = (props: Partial<IRawRHAlternanceJob> = {}): IRawRHAlternanceJob => {
  return {
    jobCode: "913079004",
    jobTitle: "Alternant - HSE H/F",
    jobCategory: "Environnement",
    jobCity: "La Grande-Motte",
    jobPostalCode: "34280",
    jobType: "Alternance",
    jobUrl: "https://rhalternance.com/jobs/environnement/la-grande-motte/alternant-hse-h-f-913079004",
    jobDescription: [
      {
        descriptionHeadline: "Détail du poste",
        descriptionText:
          "QUE FEREZ-VOUS ?<br><br>Rattaché(e) à Arnaud, Responsable HSE Outremer, vous contribuerez au déploiement d'une démarche HSE amenant les équipes vers une évolution de la maturité HSE de l'entreprise.<br><br>Vos missions principales seront :<br><br>* Participer au déploiement de la feuille de route HSE 2024-25,<br><br>* Participer à l'animation de la culture HSE dans l'établissement (1/4 sécurité/ accueil sécurité / sensibilisation quotidienne, communication «Safety First »...),<br><br>* La mise à jour de l'évaluation des risques professionnels et risques d'exposition,<br><br>* La mise en place des indicateurs et tableaux de bord,<br><br>* Veille documentaires (rédaction de documents / consignes/ mise à jour des FDS / process),<br><br>* Participer à l'analyse environnementale du site et proposition d'un plan d'action associé,<br><br>* La recherche de réduction de nos impacts, comme la réduction et/ou la valorisation de nos déchets (emballages plastiques, cartons...).<br><br>NOUS SOMMES FIERS DE POUVOIR PROPOSER DEPUIS DES ANNÉES DES PARCOURS D'ÉVOLUTION À NOS SALARIÉS.",
      },
      {
        descriptionHeadline: "Le profil recherché",
        descriptionText:
          "CE POSTE EST FAIT POUR VOUS SI VOUS :<br><br>* Vous êtes en Licence ou Master, cursus QHSE avec idéalement avec une expérience dans l'industrie (stage ou alternance),<br><br>* Vous avez connaissance des réglementations HSE, des systèmes de management QHSE,<br><br>* Vous êtes force de proposition et d'amélioration, êtes méthodique et rigoureux(se),<br><br>* Vous êtes bon communiquant et êtes à l'aise en milieu industriel,<br><br>* Vous êtes à l'aise avec les outils informatiques.<br><br>COMMENT ÇA SE PASSE ?<br><br>Envoyez-nous votre CV. Si votre profil correspond à notre besoin, vous serez contacté(e) par téléphone et accueilli(e) à la Grande Motte pour visiter le chantier et rencontrer nos équipes.<br><br>Chez Grand Large Yachting, nous avons à coeur d'exclure toute forme de discrimination dans le cadre de nos recrutements.",
      },
      {
        descriptionHeadline: "Infos complémentaires",
        descriptionText:
          "Nous vous proposons :<br><br>Un poste en alternance ouvert dès Septembre 2024 à La Grande Motte (34) à côté du port.<br>- Rémunération fixe,<br>- Primes de production,<br>- Participation aux bénéfices de l'entreprise<br>- Mutuelle intéressante pour vous et toute la famille (prise en charge employeur à 50%),<br>- Prime mobilité durable (aide pour le trajet domicile/travail si utilisation de vélo, trottinette, covoiturage),<br><br>- Nos petits plus :<br>- CSE (chèques cadeaux/vacances et divers autres avantages),<br>- Team Day,<br>- Activités nautiques en partenariat avec l'école de voile de la Grande Motte au printemps.",
      },
    ],
    jobSubmitDateTime: "2024-11-14T12:11:08",
    companyName: "GRAND LARGE YACHTING",
    companyUrl: "https://rhalternance.com/companies/grand-large-yachting-mediterranee",
    companySiret: "44537545400037",
    companyAddress: "TOURLAVILLE 420 RUE DE LA PYROTECHNIE 50100 CHERBOURG-EN-COTENTIN",
    ...props,
  }
}
