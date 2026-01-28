# Modification des données de configuration du simulateur

## Valeurs de SMIC

Pour modifier les valeurs de SMIC accéder au fichier [smic.ts](./smic.ts) et modifier les valeurs pour la métropole et pour mayotte.

_Note : les valeurs mensuelles ne sont pas utilisées mais doivent quand même être tenues à jour._

## Taux de SMIC

Pour modifier les taux de SMIC utilisés pour calculer les valeurs de salaire brut, accéder au fichier [taux-smic.ts](./taux-smic.ts)

Modifier les valeurs pour chacune des tranches d'âge et des niveaux de diplôme.

## Taux de cotisation

Pour modifier les taux de cotisations qui déterminent les charges salariales impactant le salaire brut, accéder au fichier [taux-de-cotisation.ts](./taux-de-cotisation.ts)

## Dates

### Limites

Pour modifier les limites temporelles pour la validité des champs date du formulaire et du moteur de calcul, accéder au fichier [dates.ts](./dates.ts).
_Note : ces valeurs sont générées dynamiquement avec `dayjs` (année civile en cours, âge en fonction de la date de simulation)_

### Date de mise à jour

En cas de mise à jour de n'importe laquelle de ces valeurs, accéder au fichier [dates.ts](./dates.ts) et modifier la valeur de `DATE_DERNIERE_MISE_A_JOUR` en la remplacant par la date du jour au format _AAAA-MM-JJ_
