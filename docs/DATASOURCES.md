# Sources externes de données

## Introduction

Le Tableau de bord utilise certaines données externes récupérées via API.
Ce document détaille la liste des données et l'usage qui en est fait.

## Référentiel

https://referentiel.apprentissage.onisep.fr/ & https://referentiel.apprentissage.onisep.fr/construction/source

Le Référentiel des organismes de formation en apprentissage contient 96% d’organismes validés sur le territoire national.

### Organismes

Nous utilisons la listes des organismes du référentiel pour fiabiliser les organismes transmettant des données au TDB.
Pour cela nous utilisons l'API du référentiel qui nous renvoie le contenu de la collection organismes (construite via l'aggrégation de différentes sources, cf. https://referentiel.apprentissage.onisep.fr/construction)

### UAIs de la base ACCE

Nous utilisons la liste des UAIs du référentiel pour identifier d'éventuels organismes inconnus transmettant des données au TDB.
Pour cela nous utilisons l'API du référentiel qui nous renvoie le contenu de la collection UAI (construite via la récupération des données de la base ACCE)

## Catalogue

https://catalogue-apprentissage.intercariforef.org/

## Tables de correspondances

https://tables-correspondances.apprentissage.beta.gouv.fr/api/v1/docs/

## API Entreprise

https://entreprise.api.gouv.fr

## API CFADock

https://www.cfadock.fr/Home/ApiDescription

## LaBonneAlternance

https://labonnealternance.apprentissage.beta.gouv.fr/
