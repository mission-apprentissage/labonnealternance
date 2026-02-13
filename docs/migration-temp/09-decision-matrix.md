# 09 - Matrice de Décision: Migrer ou Non?

## Pour et Contre

| Critère                 | ✅ FAIRE la migration                               | ❌ NE PAS FAIRE                                            |
| ----------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| **Architecture**        | 1 collection unifiée, plus simple                   | 2 collections + sync = complexité maintenue                |
| **Maintenance**         | Code simplifié, moins de bugs potentiels            | Connaissance existante de l'équipe sur le code actuel      |
| **Performance**         | 1 document = 1 job (requêtes directes)              | jobs[] embedded = lectures groupées par établissement      |
| **Consistance données** | Source unique de vérité                             | Risque permanent d'incohérence recruiters ↔ jobs_partners |
| **Stream processor**    | Supprimé = moins d'infra à maintenir                | Fonctionne actuellement, pourquoi toucher?                 |
| **Dette technique**     | Réduite significativement                           | Accumulée, explosion future possible                       |
| **Coût immédiat**       | 6-7 semaines dev, 57 fichiers à risque              | 0 effort, 0 risque immédiat                                |
| **Risque régression**   | Élevé pendant transition                            | Nul                                                        |
| **Valeur utilisateur**  | Aucune visible directement                          | Idem                                                       |
| **Évolutivité**         | Facilite ajout de nouveaux partenaires              | Modèle recruiter spécifique, difficile à étendre           |
| **Onboarding devs**     | 1 modèle à comprendre                               | 2 modèles + sync à expliquer                               |
| **Rollback**            | Complexe si problème post-cutover                   | N/A                                                        |
| **Monitoring**          | Simplifié (1 collection)                            | 2 collections + stream à surveiller                        |
| **Coût infra**          | Réduit (moins de stockage, pas de stream processor) | Actuel maintenu                                            |

---

## Scénarios de Décision

| Si...                                  | Alors...                               |
| -------------------------------------- | -------------------------------------- |
| Équipe stable, temps disponible        | ✅ Migrer maintenant                   |
| Roadmap chargée, features prioritaires | ❌ Reporter                            |
| Bugs fréquents liés à la sync          | ✅ Migrer (urgence technique)          |
| Sync stable depuis 6+ mois             | ❌ Pas urgent                          |
| Nouveaux partenaires à intégrer        | ✅ Migrer (uniformiser le modèle)      |
| Turnover équipe prévu                  | ❌ Éviter migration pendant transition |

---

## Analyse Coût/Bénéfice

### Coûts de la Migration

| Poste             | Estimation                |
| ----------------- | ------------------------- |
| Développement     | 6-7 semaines (1-2 devs)   |
| Tests & QA        | Inclus (générés par IA)   |
| Risque régression | Moyen (57 fichiers)       |
| Indisponibilité   | ~0 (dual-read progressif) |

### Coûts de NE PAS Migrer (par an)

| Poste                        | Estimation       |
| ---------------------------- | ---------------- |
| Maintenance stream processor | ~2-4 semaines/an |
| Debug incohérences données   | ~1-2 semaines/an |
| Onboarding nouveaux devs     | +1 jour/dev      |
| Dette technique accumulée    | Exponentielle    |

---

## Risques

### Si Migration

| Risque              | Probabilité | Impact   | Mitigation                          |
| ------------------- | ----------- | -------- | ----------------------------------- |
| Régression API      | Moyenne     | Élevé    | Dual-read, tests E2E                |
| Perte de données    | Faible      | Critique | Backup recruiters 1 mois            |
| Rollback nécessaire | Faible      | Moyen    | Feature flags, procédure documentée |
| Dépassement délai   | Moyenne     | Faible   | Timeline conservatrice              |

### Si Pas de Migration

| Risque                 | Probabilité | Impact     | Mitigation          |
| ---------------------- | ----------- | ---------- | ------------------- |
| Incohérence données    | Moyenne     | Moyen      | Monitoring, alertes |
| Panne stream processor | Faible      | Élevé      | Redondance, alertes |
| Code inmaintenable     | Certaine    | Long terme | Aucune              |
| Blocage évolution      | Moyenne     | Élevé      | Refacto partiel     |

---

## Recommandation

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   RECOMMANDATION: ✅ MIGRER                                 │
│                                                             │
│   Timing: Période calme (post-release, début de sprint)    │
│   Priorité: Moyenne (pas urgente, mais nécessaire)         │
│   Équipe: 1-2 devs dédiés pendant 6-7 semaines             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Justification

1. **Dette technique croissante** - Le coût de maintenance augmente avec le temps
2. **Sync déjà en place** - 80% du travail de mapping est fait
3. **Risque maîtrisé** - Dual-read + feature flags permettent rollback
4. **ROI positif** - Économie maintenance > coût migration après ~1 an

### Trigger Idéal

- Post-release majeure
- Début de trimestre
- Équipe au complet
- Pas de deadline feature critique

---

## Checklist Pré-Décision

- [ ] Équipe informée et alignée
- [ ] Pas de release majeure dans les 8 prochaines semaines
- [ ] Monitoring actuel de la sync OK
- [ ] Backup strategy validée
- [ ] Rollback procedure testée
