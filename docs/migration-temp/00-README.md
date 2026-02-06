# Décommissionnement de la Collection `recruiters`

## Vue d'ensemble

Ce dossier contient la documentation complète pour la migration de la collection `recruiters` vers `jobs_partners`.

## Documents

| Document                                                 | Description                                      |
| -------------------------------------------------------- | ------------------------------------------------ |
| [01-overview.md](./01-overview.md)                       | Vue d'ensemble du projet, contexte et timeline   |
| [02-schema-migration.md](./02-schema-migration.md)       | Modifications du schéma jobs_partners            |
| [03-file-changes.md](./03-file-changes.md)               | Liste détaillée des 57 fichiers à modifier       |
| [04-background-jobs.md](./04-background-jobs.md)         | Migration des jobs background                    |
| [05-feature-migration.md](./05-feature-migration.md)     | Migration des fonctionnalités métier             |
| [06-testing-rollback.md](./06-testing-rollback.md)       | Stratégie de tests et plan de rollback           |
| [07-feature-flags.md](./07-feature-flags.md)             | Feature flags pour la transition progressive     |
| [08-ai-prompts-timeline.md](./08-ai-prompts-timeline.md) | Prompts IA pour tests/cleanup + timeline révisée |

## Analyses Complémentaires

| Dossier                                                    | Description                                                 |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| [establishment-id-analysis/](./establishment-id-analysis/) | Analyse de l'impact de la suppression de `establishment_id` |

### Résultat de l'analyse `establishment_id`

**Verdict : NE PAS SUPPRIMER `establishment_id`**

- 🔴 Impact Server : 20+ fichiers, 10 endpoints API
- 🔴 Impact UI : 11+ composants, 7 routes Next.js
- 🔴 Liens Emails : URLs de délégation CFA seraient cassées
- ✅ Recommandation : Garder `establishment_id` dans `jobs_partners` pour grouper les offres

## Résumé Exécutif

- **57 fichiers** impactés
- **8 phases** de migration
- **6-7 semaines** estimées (tests et cleanup générés par IA)
- Synchronisation existante via `stream_processor` Docker service
- Migration progressive avec feature flags et dual-read

## État Actuel

La synchronisation `recruiters` → `jobs_partners` existe déjà via :

- Service Docker `stream_processor`
- Change streams MongoDB dans `formulaire.service.ts` (lignes 889-1143)
- Mapping des champs dans `upsertJobPartnersFromRecruiter()`

## Prochaines Étapes

1. Valider le plan avec l'équipe
2. Créer les migrations de schéma
3. Implémenter les corrections de sync
4. Migrer les services par priorité
