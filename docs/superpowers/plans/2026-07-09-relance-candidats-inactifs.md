# Relance des candidats inactifs (J+7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relancer une seule fois par email les candidats ayant fait une candidature puis restés inactifs 7 jours, via une liste Brevo dédiée, avec un lien de recherche pré-rempli sur leur propre recherche.

**Architecture :** Un nouveau job cron quotidien côté `server/` sélectionne les candidats dont la dernière candidature (`applicants.last_connection`) remonte à ~7 jours et qui n'ont pas re-candidaté depuis, reconstruit leur lien de recherche à partir de l'URL stockée sur leur dernière candidature (`applications.application_url`), et pousse `email + prénom + lien + métier` dans une **liste marketing Brevo dédiée** (réutilise `uploadContactListToBrevo`). L'envoi de l'email et le contenu sont pilotés dans l'interface Brevo (automation + template) par l'équipe growth. Un log `RELANCE_INACTIVITE` dans `applicants_email_logs` garantit une seule relance par candidat.

**Tech Stack :** Fastify, MongoDB (driver natif + agrégations), Zod, SDK `@getbrevo/brevo` (via service existant), Vitest, Biome.

## Global Constraints

- Linting/formatage **Biome** (jamais ESLint/Prettier) ; indentation 2 espaces ; ligne max **180 caractères**.
- **TypeScript strict** ; imports via l'alias `@/*` (jamais de `../../`) ; imports `shared/*` pour les modèles partagés.
- Commits conventionnels : `feat(lba-XXXX): description` (préfixe autorisé aussi `feat:` si pas de numéro d'issue).
- **Reproduire les patterns existants** : le job doit être indiscernable de `server/src/jobs/partenaireExport/exportRecrutersToBrevo.ts` et `exportContactsToBrevo.ts`.
- Ne JAMAIS committer la config Claude (`.claude`, `CLAUDE.md`, skills, agents).
- Le back-end n'est pas déployé par l'utilisateur : le livrable est une PR relue par un·e dev.

### Décisions produit (verrouillées avec l'utilisateur)

- **Cap à UNE relance** par candidat (jamais de J+14).
- **Fenêtre = J+7** : `last_connection` dans `[maintenant − 8 jours, maintenant − 7 jours)` (tranche de 24 h, le cron tourne chaque jour). `last_connection` = date de la dernière candidature (mis à jour à chaque candidature par `getOrCreateApplicant`).
- **CTA personnalisé** quand on peut reconstruire un lien de recherche exploitable (au moins un `romes`/`rncp`) depuis `application_url` ; sinon **CTA générique** (attribut `LIEN_RECHERCHE` vide → template générique côté Brevo).
- **2 templates côté Brevo** : une seule liste poussée, l'équipe growth segmente sur la présence de l'attribut `LIEN_RECHERCHE` (rempli = template personnalisé, vide = template générique).

### Côté Brevo (à faire par l'utilisateur / growth, hors code)

1. Créer une **liste marketing dédiée** "Relance candidats inactifs" et récupérer son **ID numérique**.
2. Communiquer cet ID à l'ops pour renseigner `LBA_BREVO_RELANCE_CANDIDATS_LIST_ID` dans les secrets SOPS (voir Task 1).
3. Construire l'automation + les 2 templates (personnalisé si `LIEN_RECHERCHE` rempli, générique sinon). Attributs disponibles sur le contact : `EMAIL`, `PRENOM`, `LIEN_RECHERCHE`, `METIER`.

---

### Task 1: Enum de log dédié + variable d'environnement de la liste Brevo

**Files:**
- Modify: `shared/src/models/applicantEmailLog.model.ts:9-14` (ajout d'une valeur d'enum)
- Modify: `server/src/config.ts:33-45` (ajout de la clé de config)
- Modify: `server/.env.test:20-26` (valeur de test)
- Modify: `.infra/.env_server` (placeholder de template — pour l'ops)

**Interfaces:**
- Produces : `EMAIL_LOG_TYPE.RELANCE_INACTIVITE` (string enum value `"RELANCE_INACTIVITE"`), consommé par Task 2.
- Produces : `config.smtp.brevoRelanceCandidatsListId: string | undefined`, consommé par Task 2.

- [ ] **Step 1: Ajouter la valeur d'enum dédiée**

Dans `shared/src/models/applicantEmailLog.model.ts`, ajouter `RELANCE_INACTIVITE` (distincte de `RELANCE`, déjà réservée à d'autres flux) :

```ts
export enum EMAIL_LOG_TYPE {
  RELANCE = "RELANCE",
  RELANCE_INACTIVITE = "RELANCE_INACTIVITE",
  NOTIFICATION = "NOTIFICATION",
  INTENTION_ENTRETIEN = "INTENTION_ENTRETIEN",
  INTENTION_REFUS = "INTENTION_REFUS",
}
```

- [ ] **Step 2: Ajouter la clé de config Brevo**

Dans `server/src/config.ts`, bloc `smtp` (après `brevoMarketingContactListId`, ligne 44), ajouter (optionnelle comme les autres list IDs, via `.asString()` sans `.required()`) :

```ts
    brevoMarketingContactListId: env.get("LBA_BREVO_MARKETING_CONTACT_LIST_ID").asString(),
    brevoRelanceCandidatsListId: env.get("LBA_BREVO_RELANCE_CANDIDATS_LIST_ID").asString(),
```

- [ ] **Step 3: Ajouter la valeur de test**

Dans `server/.env.test`, à la suite des autres `LBA_BREVO_*`, ajouter :

```
LBA_BREVO_RELANCE_CANDIDATS_LIST_ID=999
```

- [ ] **Step 4: Ajouter le placeholder de déploiement (pour l'ops)**

Dans `.infra/.env_server`, à la suite des autres `LBA_BREVO_*`, ajouter :

```
LBA_BREVO_RELANCE_CANDIDATS_LIST_ID={{ LBA_BREVO_RELANCE_CANDIDATS_LIST_ID }}
```

> Note : la valeur chiffrée réelle (ID de la liste Brevo) devra être ajoutée par l'ops dans `.infra/env.production.yml` (et recette/preview) via SOPS. En son absence, le job se contente de logguer un warning et ne fait rien (voir Task 2, garde-fou `listId`). Ce n'est donc pas bloquant pour merger.

- [ ] **Step 5: Vérifier la compilation**

Run: `cd server && yarn typecheck`
Expected: PASS (aucune erreur de type liée à l'enum ou à la config)

- [ ] **Step 6: Commit**

```bash
git add shared/src/models/applicantEmailLog.model.ts server/src/config.ts server/.env.test .infra/.env_server
git commit -m "feat: ajoute EMAIL_LOG_TYPE.RELANCE_INACTIVITE et la config liste Brevo de relance"
```

---

### Task 2: Job de relance des candidats inactifs

**Files:**
- Create: `server/src/jobs/applications/relanceCandidatsInactifs.ts`
- Test: `server/src/jobs/applications/relanceCandidatsInactifs.test.ts`

**Interfaces:**
- Consumes : `EMAIL_LOG_TYPE.RELANCE_INACTIVITE` (Task 1), `config.smtp.brevoRelanceCandidatsListId` (Task 1), `uploadContactListToBrevo(account, contacts, contactMapper, listId)` (existant, `server/src/services/brevo.service.ts:82`).
- Produces :
  - `buildRelanceSearchUrl(application_url: string | null | undefined): string | null`
  - `relanceCandidatsInactifs(): Promise<void>` — handler du cron, consommé par Task 3.

- [ ] **Step 1: Écrire les tests unitaires de `buildRelanceSearchUrl` (échec attendu)**

Créer `server/src/jobs/applications/relanceCandidatsInactifs.test.ts` :

```ts
import { ObjectId } from "mongodb"
import { EMAIL_LOG_TYPE } from "shared/models/applicantEmailLog.model"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { IApplicant } from "shared/models/applicant.model"
import type { IApplication } from "shared/models/applications.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { uploadContactListToBrevo } from "@/services/brevo.service"

import { buildRelanceSearchUrl, relanceCandidatsInactifs } from "./relanceCandidatsInactifs"

vi.mock("@/services/brevo.service", () => ({ uploadContactListToBrevo: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/common/utils/slackUtils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))

describe("buildRelanceSearchUrl", () => {
  it("réécrit et re-tague une URL de recherche exploitable", () => {
    const result = buildRelanceSearchUrl(
      "https://labonnealternance.apprentissage.beta.gouv.fr/recherche?romes=E1401,E1402&lat=43.282&lon=5.405&address=Marseille+13001&utm_source=old"
    )
    expect(result).not.toBeNull()
    const url = new URL(result as string)
    expect(url.pathname).toBe("/recherche")
    expect(url.searchParams.get("romes")).toBe("E1401,E1402")
    expect(url.searchParams.get("address")).toBe("Marseille 13001")
    expect(url.searchParams.get("utm_source")).toBe("lba-brevo")
    expect(url.searchParams.get("utm_campaign")).toBe("relance-candidat-inactif")
  })

  it("réécrit un pathname /emploi/ vers /recherche", () => {
    const result = buildRelanceSearchUrl("https://labonnealternance.apprentissage.beta.gouv.fr/emploi/abc?romes=E1401")
    expect(new URL(result as string).pathname).toBe("/recherche")
  })

  it("retourne null si aucun métier (romes/rncp) exploitable", () => {
    expect(buildRelanceSearchUrl("https://labonnealternance.apprentissage.beta.gouv.fr/recherche?address=Marseille")).toBeNull()
  })

  it("retourne null pour une URL absente ou invalide", () => {
    expect(buildRelanceSearchUrl(null)).toBeNull()
    expect(buildRelanceSearchUrl(undefined)).toBeNull()
    expect(buildRelanceSearchUrl("pas-une-url")).toBeNull()
  })
})
```

- [ ] **Step 2: Lancer les tests → échec attendu**

Run: `cd server && yarn vitest run src/jobs/applications/relanceCandidatsInactifs.test.ts`
Expected: FAIL — `buildRelanceSearchUrl` / `relanceCandidatsInactifs` introuvables (module non créé).

- [ ] **Step 3: Créer le job avec `buildRelanceSearchUrl` et `relanceCandidatsInactifs`**

Créer `server/src/jobs/applications/relanceCandidatsInactifs.ts` :

```ts
import { ObjectId } from "mongodb"
import { EMAIL_LOG_TYPE } from "shared/models/applicantEmailLog.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import { uploadContactListToBrevo } from "@/services/brevo.service"

const RELANCE_INACTIVITE_UTM_CAMPAIGN = "relance-candidat-inactif"
const DAY_MS = 24 * 60 * 60 * 1000
// Fenêtre J+7 : dernière candidature entre 8 et 7 jours avant maintenant (tranche de 24 h, cron quotidien)
const INACTIVITY_WINDOW_START_DAYS = 8
const INACTIVITY_WINDOW_END_DAYS = 7

type RelanceCandidatRow = {
  email: string
  firstname: string
  lien_recherche: string
  metier: string
}

type CandidateAggregate = {
  _id: ObjectId
  email: string
  firstname: string
  application_url: string | null
  job_searched_by_user: string | null
  job_title: string | null
}

export const buildRelanceSearchUrl = (application_url: string | null | undefined): string | null => {
  if (!application_url) {
    return null
  }
  let url: URL
  try {
    url = new URL(application_url)
  } catch {
    return null
  }
  if (url.pathname.startsWith("/emploi/")) {
    url.pathname = "/recherche"
  }
  // On ne garde que les recherches réellement exploitables (au moins un métier)
  if (!url.searchParams.get("romes") && !url.searchParams.get("rncp")) {
    return null
  }
  url.searchParams.delete("utm_source")
  url.searchParams.delete("utm_medium")
  url.searchParams.delete("utm_campaign")
  url.searchParams.set("utm_source", "lba-brevo")
  url.searchParams.set("utm_medium", "email")
  url.searchParams.set("utm_campaign", RELANCE_INACTIVITE_UTM_CAMPAIGN)
  return url.toString()
}

export const relanceCandidatsInactifs = async () => {
  const listId = config.smtp.brevoRelanceCandidatsListId
  if (!listId) {
    logger.warn("relanceCandidatsInactifs: LBA_BREVO_RELANCE_CANDIDATS_LIST_ID non configuré, job ignoré")
    return
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() - INACTIVITY_WINDOW_START_DAYS * DAY_MS)
  const windowEnd = new Date(now.getTime() - INACTIVITY_WINDOW_END_DAYS * DAY_MS)

  const candidates = await getDbCollection("applicants")
    .aggregate<CandidateAggregate>([
      { $match: { last_connection: { $gte: windowStart, $lt: windowEnd } } },
      {
        $lookup: {
          from: "applicants_email_logs",
          let: { applicantId: "$_id" },
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$applicant_id", "$$applicantId"] }, { $eq: ["$type", EMAIL_LOG_TYPE.RELANCE_INACTIVITE] }] } } }],
          as: "relance_logs",
        },
      },
      { $match: { relance_logs: { $size: 0 } } },
      {
        $lookup: {
          from: "applications",
          let: { applicantId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$applicant_id", "$$applicantId"] } } }, { $sort: { created_at: -1 } }, { $limit: 1 }],
          as: "last_application",
        },
      },
      { $unwind: "$last_application" },
      {
        $project: {
          _id: 1,
          email: 1,
          firstname: 1,
          application_url: "$last_application.application_url",
          job_searched_by_user: "$last_application.job_searched_by_user",
          job_title: "$last_application.job_title",
        },
      },
    ])
    .toArray()

  if (candidates.length === 0) {
    logger.info("relanceCandidatsInactifs: aucun candidat à relancer")
    return
  }

  const rows: RelanceCandidatRow[] = candidates.map((candidate) => ({
    email: candidate.email,
    firstname: candidate.firstname,
    lien_recherche: buildRelanceSearchUrl(candidate.application_url) ?? "",
    metier: candidate.job_searched_by_user ?? candidate.job_title ?? "",
  }))

  await uploadContactListToBrevo(
    "MARKETING",
    rows,
    [
      { key: "email", header: "EMAIL" },
      { key: "firstname", header: "PRENOM" },
      { key: "lien_recherche", header: "LIEN_RECHERCHE" },
      { key: "metier", header: "METIER" },
    ],
    listId
  )

  await getDbCollection("applicants_email_logs").insertMany(
    candidates.map((candidate) => ({
      _id: new ObjectId(),
      applicant_id: candidate._id,
      application_id: null,
      type: EMAIL_LOG_TYPE.RELANCE_INACTIVITE,
      message_id: null,
      createdAt: new Date(),
    }))
  )

  await notifyToSlack({ subject: "RELANCE CANDIDATS INACTIFS", message: `${rows.length} candidat(s) poussé(s) vers la liste Brevo de relance`, error: false })
  logger.info(`relanceCandidatsInactifs: ${rows.length} candidat(s) relancé(s)`)
}
```

- [ ] **Step 4: Lancer les tests unitaires → succès attendu**

Run: `cd server && yarn vitest run src/jobs/applications/relanceCandidatsInactifs.test.ts -t buildRelanceSearchUrl`
Expected: PASS (4 tests)

- [ ] **Step 5: Ajouter le test d'intégration du job (échec attendu)**

Ajouter à la fin de `server/src/jobs/applications/relanceCandidatsInactifs.test.ts` :

```ts
const BASE_URL = "https://labonnealternance.apprentissage.beta.gouv.fr"

const makeApplicant = (over: Partial<IApplicant>): IApplicant => ({
  _id: new ObjectId(),
  firstname: "Alex",
  lastname: "Martin",
  email: `alex-${new ObjectId().toHexString()}@example.com`,
  phone: "0600000000",
  last_connection: new Date("2026-07-01"),
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-07-01"),
  ...over,
})

const makeApplication = (applicantId: ObjectId, over: Partial<IApplication>): IApplication =>
  ({
    _id: new ObjectId(),
    applicant_id: applicantId,
    created_at: new Date("2026-07-01"),
    application_url: `${BASE_URL}/recherche?romes=E1401&lat=43.282&lon=5.405&address=Marseille+13001`,
    job_searched_by_user: "Communication, marketing, publicité",
    job_title: null,
    scan_status: "NO_VIRUS_DETECTED",
  }) as unknown as IApplication

describe("relanceCandidatsInactifs", () => {
  useMongo()

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-07-09T09:00:00Z"))
    vi.mocked(uploadContactListToBrevo).mockClear()
    return async () => {
      vi.useRealTimers()
      await getDbCollection("applicants").deleteMany({})
      await getDbCollection("applications").deleteMany({})
      await getDbCollection("applicants_email_logs").deleteMany({})
    }
  })

  it("pousse les candidats de la fenêtre J+7 vers Brevo et logue la relance", async () => {
    // dernière candidature il y a ~7,4 jours → dans la fenêtre [J-8, J-7)
    const inWindow = makeApplicant({ last_connection: new Date("2026-07-01T18:00:00Z"), firstname: "Inès" })
    await getDbCollection("applicants").insertOne(inWindow)
    await getDbCollection("applications").insertOne(makeApplication(inWindow._id, { created_at: new Date("2026-07-01T18:00:00Z") }))

    await relanceCandidatsInactifs()

    expect(uploadContactListToBrevo).toHaveBeenCalledTimes(1)
    const [account, rows, , listId] = vi.mocked(uploadContactListToBrevo).mock.calls[0]
    expect(account).toBe("MARKETING")
    expect(listId).toBe("999")
    expect(rows).toHaveLength(1)
    expect(rows[0].email).toBe(inWindow.email)
    expect(rows[0].firstname).toBe("Inès")
    expect(rows[0].metier).toBe("Communication, marketing, publicité")
    expect(rows[0].lien_recherche).toContain("/recherche?")
    expect(rows[0].lien_recherche).toContain("utm_campaign=relance-candidat-inactif")

    const logs = await getDbCollection("applicants_email_logs").find({ applicant_id: inWindow._id, type: EMAIL_LOG_TYPE.RELANCE_INACTIVITE }).toArray()
    expect(logs).toHaveLength(1)
  })

  it("exclut les candidats hors fenêtre et ceux déjà relancés", async () => {
    // hors fenêtre : dernière candidature hier
    const tooRecent = makeApplicant({ last_connection: new Date("2026-07-08T09:00:00Z") })
    await getDbCollection("applicants").insertOne(tooRecent)
    await getDbCollection("applications").insertOne(makeApplication(tooRecent._id, { created_at: new Date("2026-07-08T09:00:00Z") }))

    // dans la fenêtre mais déjà relancé
    const alreadyRelaunched = makeApplicant({ last_connection: new Date("2026-07-01T18:00:00Z") })
    await getDbCollection("applicants").insertOne(alreadyRelaunched)
    await getDbCollection("applications").insertOne(makeApplication(alreadyRelaunched._id, { created_at: new Date("2026-07-01T18:00:00Z") }))
    await getDbCollection("applicants_email_logs").insertOne({
      _id: new ObjectId(),
      applicant_id: alreadyRelaunched._id,
      application_id: null,
      type: EMAIL_LOG_TYPE.RELANCE_INACTIVITE,
      message_id: null,
      createdAt: new Date("2026-07-02"),
    })

    await relanceCandidatsInactifs()

    expect(uploadContactListToBrevo).not.toHaveBeenCalled()
  })

  it("laisse LIEN_RECHERCHE vide quand l'URL n'est pas exploitable (CTA générique)", async () => {
    const generic = makeApplicant({ last_connection: new Date("2026-07-01T18:00:00Z") })
    await getDbCollection("applicants").insertOne(generic)
    await getDbCollection("applications").insertOne(makeApplication(generic._id, { created_at: new Date("2026-07-01T18:00:00Z"), application_url: null }))

    await relanceCandidatsInactifs()

    const [, rows] = vi.mocked(uploadContactListToBrevo).mock.calls[0]
    expect(rows[0].lien_recherche).toBe("")
  })
})
```

- [ ] **Step 6: Lancer tout le fichier de test → succès attendu**

Run: `cd server && yarn vitest run src/jobs/applications/relanceCandidatsInactifs.test.ts`
Expected: PASS (tous les tests, unitaires + intégration)

> Si l'insertion `as unknown as IApplication` heurte le typecheck strict du repo, préférer un fixture existant s'il y en a un (`grep -rl "IApplication" shared/src/fixtures server/tests` pour vérifier), sinon conserver le cast dans le fichier de test uniquement.

- [ ] **Step 7: Vérifier lint + typecheck**

Run: `cd server && yarn biome check src/jobs/applications/relanceCandidatsInactifs.ts src/jobs/applications/relanceCandidatsInactifs.test.ts && yarn typecheck`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add server/src/jobs/applications/relanceCandidatsInactifs.ts server/src/jobs/applications/relanceCandidatsInactifs.test.ts
git commit -m "feat: job de relance des candidats inactifs vers Brevo (J+7)"
```

---

### Task 3: Enregistrement du cron quotidien

**Files:**
- Modify: `server/src/jobs/jobs.ts` (import + entrée de cron, autour de la ligne 197)

**Interfaces:**
- Consumes : `relanceCandidatsInactifs` (Task 2).

- [ ] **Step 1: Importer le handler**

Dans `server/src/jobs/jobs.ts`, ajouter l'import à côté des autres imports de jobs `applications` :

```ts
import { relanceCandidatsInactifs } from "./applications/relanceCandidatsInactifs"
```

- [ ] **Step 2: Ajouter l'entrée de cron**

Dans le même objet que `"Export contact recruteurs vers Brevo"` (jobs.ts:197-200), ajouter une entrée (mêmes conventions, pas de `tag`) — planifiée le matin, décalée des autres exports Brevo :

```ts
          "Export contact recruteurs vers Brevo": {
            cron_string: "10 4 * * *",
            handler: exportRecruteursToBrevo,
          },
          "Relance des candidats inactifs (J+7 sans nouvelle candidature)": {
            cron_string: "0 7 * * *",
            handler: relanceCandidatsInactifs,
          },
```

- [ ] **Step 3: Vérifier lint + typecheck**

Run: `cd server && yarn biome check src/jobs/jobs.ts && yarn typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/src/jobs/jobs.ts
git commit -m "feat: planifie le cron quotidien de relance des candidats inactifs"
```

---

## Self-Review

**Spec coverage :**
- Cible = candidats inactifs 7 j après candidature → Task 2 (`$match` sur `last_connection` fenêtre [J-8, J-7)). ✅
- Cap à 1 relance → Task 1 (enum `RELANCE_INACTIVITE`) + Task 2 (`$lookup` exclusion + `insertMany` des logs). ✅
- Lien de recherche personnalisé depuis la recherche du candidat → Task 2 (`buildRelanceSearchUrl` sur `application_url`). ✅
- CTA générique en fallback → Task 2 (`lien_recherche = ""`), 2 templates côté Brevo (segmentation sur `LIEN_RECHERCHE`). ✅
- Push liste Brevo dédiée, sans code d'envoi → Task 2 (`uploadContactListToBrevo("MARKETING", ...)`) ; template/automation côté Brevo (hors code). ✅
- Cron quotidien → Task 3. ✅
- Config liste Brevo → Task 1. ✅

**Placeholder scan :** aucun TODO/TBD ; code complet à chaque étape.

**Type consistency :** `buildRelanceSearchUrl` (signature identique Task 2 ↔ tests) ; `EMAIL_LOG_TYPE.RELANCE_INACTIVITE` (Task 1 → Task 2) ; `config.smtp.brevoRelanceCandidatsListId` (Task 1 → Task 2) ; colonnes CSV `email/firstname/lien_recherche/metier` ↔ headers `EMAIL/PRENOM/LIEN_RECHERCHE/METIER` cohérentes ; `uploadContactListToBrevo(account, contacts, contactMapper, listId)` conforme à `brevo.service.ts:82`.

## Points à confirmer par un·e dev avant merge

1. **`notifyToSlack`** — vérifier la signature exacte (`server/src/common/utils/slackUtils.ts`) et l'aligner ; retirer l'appel s'il n'est pas souhaité pour ce job.
2. **Cast de test `as unknown as IApplication`** — remplacer par un fixture si le repo en fournit un pour les candidatures.
3. **Fuseau horaire de la fenêtre** — la fenêtre est calculée en UTC ; acceptable car tranche de 24 h, mais à valider avec le comportement attendu du métier.
4. **Volumétrie** — l'agrégation démarre par un `$match` indexé sur `last_connection`? Vérifier qu'un index existe sur `applicants.last_connection` ; sinon envisager de l'ajouter (le `$match` reste sur une tranche de 24 h, volume modéré).
