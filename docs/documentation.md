# Widget - Des solutions clef en main, faciles à intégrer

## **Comment utiliser les widgets La bonne alternance ?**

Le service La bonne alternance propose plusieurs widgets, exploitables selon vos besoins.

Chaque widget est accessible unitairement et gratuitement.&#x20;

Nous demandons uniquement à l'ensemble des utilisateurs de ces widget de s'identifier grâce à la valorisation d'un paramètre détaillé dans chaque documentation.

### Exposer les opportunités d’emploi et/ou de formations en alternance

Ce widget permet&#x20;

* d'exposer les offres d'emploi et/ou de formation centralisée par La bonne alternance
* aux candidats de postuler auprès des entreprises et de contacter les centres de formation

Les données exposées sur ce widget peuvent être filtrées :

* sur un métier ou un ensemble de métiers (référentiel [ROME](https://www.data.gouv.fr/fr/datasets/repertoire-operationnel-des-metiers-et-des-emplois-rome/)),
* sur une zone géographique donnée : adresse, ville, code postal, département (disponible prochainement), région (disponible prochainement),
* sur le périmètre, afin de n'exposer que les formations, que les emplois, ou les deux.

Ainsi, en tant que jobboard vous pouvez choisir de n'afficher que les opportunités d'emploi en alternance (offres + entreprises auprès desquelles adresser des candidatures spontanées). En tant qu'OPCO, vous pouvez choisir de n'afficher que les formations et/ou les entreprises de vos branches professionnelles. En tant que CFA, vous pourrez choisir de n'afficher que les entreprises correspondant à vos métiers ainsi que votre zone géographique.

🔎 Exemple d’exploitation du widget sur [**jassuremonfutur**](https://www.jassuremonfutur.fr/annuaire-formation-assurance), en lançant une recherche “Chargé de clientèle” à “Paris”.

📄 Comment exploiter le widget ? [Consultez cette documentation.](https://api.gouv.fr/guides/widget-la-bonne-alternance)

👉 Comment tester le widget ? [Consultez cette page.](https://labonnealternance.apprentissage.beta.gouv.fr/test-widget)

### Permettre aux candidats de postuler auprès des entreprises

Ce widget vous intéressera si vous avez décidé de consommer les données d'emploi de La bonne alternance via API. Pour simplifier l’envoi de candidatures entre candidats et recruteurs, vous pouvez utiliser ce widget. Ce service de candidature en ligne est déjà déployé par défaut au sein du widget d'exposition des opportunités d’emploi et/ou de formations en alternance

🔎 Exemple d’exploitation du widget sur le site de [1jeune1solution](https://www.1jeune1solution.gouv.fr/apprentissage?).

📄 Comment exploiter et tester le widget ?&#x20;

<details>

<summary>Documentation</summary>

Utilisez le code suivant au sein d’une balise HTML, en remplaçant \[ORIGINE] par le nom de votre établissement (exemple "Onisep", "Akto", "Région PDL"), afin que nous puissions suivre votre usage du service



```html
<iframe src="https://labonnealternance.apprentissage.beta.gouv.fr/postuler?caller=[ORIIGINE]&itemId=identifiant_societe_ou_offre&type=lba|lbb|matcha" />
```

Les paramètres d'appel caller, itemId et type sont obligatoires :

* **caller :** Un identifiant de votre choix pour nous signaler qui vous êtes
* **itemId :** l'identifiant de l'offre pour postuler à une offre publiée via La bonne alternance recruteur ou l'identifiant de la société (SIRET) pour une candidature spontanée vers une société identifiée comme susceptible de recruter en alternance
* **type :** le type de candidature. **lba** ou **lbb** pour une candidature spontanée. **matcha** pour une offre publiée sur La bonne alternance recruteur.

A noter qu'itemId et type doivent être cohérents et correspondre à des sociétés/offres pour lesquelles nous disposons des informations nécessaires pour postuler.

Vous pouvez récupérer ces informations en utilisant les apis de la La bonne alternance.

Les sociétés compatibles avec le widget pour postuler sont celles comportant le fragment JSON suivant renseigné :

**"contact": { "email": "----", "iv": "----" }**

Le type peut être trouvé grâce à l'attribut ideaType du JSON.

L'itemId (SIRET) pour les **lba** et **lbb** se trouve ici : **"company": { "siret": itemId...**

L'itemId pour les **matcha** se trouve ici : **"job": { "id": itemId...**

NOTE : pour postuler aux offres de Pôle emploi, le candidat doit être redirigé vers l'URL de l'offre sur le site de Pôle emploi

</details>

### Collecter des offres d’emploi en toute simplicité

Ce widget vous permet d'intégrer rapidement un formulaire simplifié de dépôt d’offres sur votre site.

🔎 Exemple d’exploitation du widget sur le site de [**l’OPCO AKTO**](https://www.akto.fr/deposer-une-offre-demploi-en-alternance/)

📄 Comment exploiter le widget  ?&#x20;

<details>

<summary>Documentation</summary>

Utilisez le code suivant au sein d’une balise HTML, en remplaçant \[ORIGINE] par le nom de votre établissement  (exemple "Onisep", "Akto", "Région PDL"), afin que nous puissions suivre votre usage du service

```html
<iframe loading="lazy" src="https://labonnealternance.apprentissage.beta.gouv.fr/espace-pro/widget/[ORIGINE]/" width="100%" height="800" frameborder="0" style="max-width: 100%;"></iframe>
```

</details>

👉 Comment tester le widget ? Consultez [cette page.](https://matcha-recette.apprentissage.beta.gouv.fr/widget/matcha)



