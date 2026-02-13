# Flux de creation de compte Entreprise / CFA

> Documentation du flux complet, du frontend au backend, pour la creation de comptes recruteurs sur La bonne alternance.

---

## Sommaire

- [Resume simplifie](#resume-simplifie)
- [Parcours utilisateur en bref](#parcours-utilisateur-en-bref)
- [Creation de compte (flux detaille)](#creation-de-compte-flux-detaille)
  - [Etape 1 - Page d'entree](#etape-1---page-dentree-front)
  - [Etape 2 - Recherche SIRET](#etape-2---autocomplete-siret-front)
  - [Etape 3 - Validation du SIRET](#etape-3---validation-du-siret-au-submit-front-vers-back)
  - [Etape 4a - Backend entreprise](#etape-4a---backend--get-etablissemententreprisesiret)
  - [Etape 4b - Backend CFA](#etape-4b---backend--get-etablissementcfasiretvalidate-creation)
  - [Etape 5 - Formulaire coordonnees](#etape-5---redirection-vers-la-page-detail-front)
  - [Etape 6 - Creation du compte](#etape-6---backend--post-etablissementcreation)
  - [Etape 7 - Apres la creation](#etape-7---apres-la-creation-front)
- [Emails envoyes aux utilisateurs](#emails-envoyes-aux-utilisateurs)
  - [ENTREPRISE auto-valide](#entreprise---auto-valide-granted)
  - [ENTREPRISE en attente](#entreprise---en-attente-de-validation-awaiting_validation)
  - [CFA auto-valide](#cfa---auto-valide-granted)
  - [CFA en attente](#cfa---en-attente-de-validation-awaiting_validation)
  - [Email de desactivation](#email-de-desactivation-tous-types)
  - [Emails planifies](#emails-planifies-crons)
  - [Tableau recapitulatif](#tableau-recapitulatif-des-emails)
- [Connexion (magic link)](#connexion-magic-link)
- [Problemes connus](#problemes-connus)
- [Reference technique](#reference-technique)
  - [Collections MongoDB](#collections-mongodb-impliquees)
  - [APIs externes](#apis-externes-appelees)
  - [Schema du flux complet](#schema-du-flux-complet)

---

## Resume simplifie

La bonne alternance permet a deux types d'organisations de creer un compte recruteur :

- **Les entreprises** qui souhaitent publier des offres d'alternance
- **Les organismes de formation (CFA)** qui publient des offres pour le compte de leurs entreprises partenaires

### Comment ca marche ?

1. L'utilisateur arrive sur la page de creation de compte et cherche son etablissement par nom ou numero SIRET
2. Le systeme verifie que l'etablissement existe, qu'il est ouvert, et qu'il n'a pas deja de compte
3. L'utilisateur remplit ses coordonnees (nom, prenom, telephone, email)
4. Le compte est cree. Selon le type d'organisation, l'utilisateur est :
   - **Auto-valide** : son compte est immediatement actif (par exemple, si son email correspond a un email connu dans nos bases)
   - **En attente de validation** : un administrateur ou un OPCO doit valider manuellement son compte

### Validation automatique : comment ca se decide ?

| Type           | Condition d'auto-validation                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Entreprise** | L'email ou le domaine email correspond a une entreprise connue dans la base BAL (historique La bonne alternance) |
| **CFA**        | L'email ou le domaine email correspond a un contact present dans le referentiel national de l'apprentissage      |

### Quels emails sont envoyes ?

Apres la creation du compte, l'utilisateur recoit des emails en fonction de son parcours :

1. **Email de confirmation** : demande de verifier son adresse email (lien cliquable valable 30 jours)
2. **Email de bienvenue** : envoye apres la verification de l'email, uniquement si le compte est valide
3. **Email engagement handicap** : propose a l'entreprise de s'engager en faveur de l'emploi des personnes handicapees (uniquement pour les entreprises)

Pour plus de details, voir la section [Emails envoyes aux utilisateurs](#emails-envoyes-aux-utilisateurs).

---

## Parcours utilisateur en bref

```
Utilisateur arrive sur /espace-pro/creation/entreprise
          |
          v
  Recherche son etablissement (nom ou SIRET)
          |
          v
  Selection d'un resultat --> verification backend
          |
          v
  Remplit ses coordonnees (nom, prenom, tel, email)
          |
          v
  Compte cree !
          |
     +--[Entreprise]--> Recoit email de confirmation immediatement
     |                  puis peut creer sa premiere offre
          |
          +--[CFA auto-valide]--> recoit email de confirmation immediatement
          |
          +--[CFA en attente]--> page d'attente, notification Slack aux admins
```

---

## Creation de compte (flux detaille)

### Etape 1 - Page d'entree (Front)

#### Fichiers

| Fichier                                                                       | Role                                |
| ----------------------------------------------------------------------------- | ----------------------------------- |
| `ui/app/(espace-pro-creation-compte)/espace-pro/creation/entreprise/page.tsx` | Page Next.js                        |
| `ui/components/espace_pro/Authentification/CreationCompte.tsx`                | Composant principal                 |
| `ui/utils/routes.utils.ts` (L175-182)                                         | Configuration route et metadata SEO |

#### Fonctionnement

La page Next.js rend le composant `CreationCompte` avec `type=AUTHTYPE.ENTREPRISE` (`"ENTREPRISE"`).

Le composant `CreationCompte` :

- Affiche un titre "Vous recrutez des alternants ?" et un sous-titre
- Gere deux onglets (Entreprise / CFA) via `selectedTab`
- Detecte automatiquement le type d'organisation : si le code NAF commence par `85` (education), bascule vers CFA
- Affiche un `Bandeau` d'erreur conditionnel (Qualiopi, etablissement ferme, etc.)
- Rend deux sous-composants :
  - `CreationCompteForm` - le formulaire de recherche SIRET
  - `InformationsSiret` - panneau d'info lateral avec les onglets Entreprise/CFA

---

### Etape 2 - Autocomplete SIRET (Front)

#### Fichiers

| Fichier                                                           | Role                        |
| ----------------------------------------------------------------- | --------------------------- |
| `ui/components/espace_pro/Authentification/SiretAutocomplete.tsx` | Composant autocomplete      |
| `ui/services/searchEntreprises.ts`                                | Service d'appel API externe |

#### Fonctionnement

1. L'utilisateur tape un nom ou SIRET dans un champ autocomplete
2. Appel a l'**API externe gouvernementale** :
   ```
   GET https://recherche-entreprises.api.gouv.fr/search?q={search}&minimal=true&include=matching_etablissements
   ```
3. Les resultats sont filtres : seuls les etablissements actifs (`etat_administratif === "A"`) sont affiches sous forme de cartes (raison sociale, SIRET, adresse)
4. L'utilisateur selectionne un etablissement, le SIRET est injecte dans le formulaire Formik
5. Validation du champ via un schema `SIRETValidation()` (14 chiffres)

#### Schema de reponse API

```typescript
{
  results: [
    {
      siren: string,
      nom_complet: string,
      nom_raison_sociale: string,
      activite_principale: string, // Code NAF
      etat_administratif: string, // "A" = actif
      matching_etablissements: [
        {
          siret: string,
          adresse: string,
          nom_commercial: string,
          activite_principale: string,
          etat_administratif: string,
        },
      ],
    },
  ]
}
```

---

### Etape 3 - Validation du SIRET au submit (Front vers Back)

#### Fichiers

| Fichier                                                                  | Role                  |
| ------------------------------------------------------------------------ | --------------------- |
| `ui/components/espace_pro/Authentification/CreationCompte.tsx` (L48-134) | Logique de soumission |
| `ui/utils/api.ts`                                                        | Fonctions d'appel API |

#### Fonctionnement

Au clic sur "Continuer", le formulaire appelle une des deux API selon le type :

- **ENTREPRISE** : `getEntrepriseInformation(siret)` -> `GET /etablissement/entreprise/:siret`
- **CFA** : `validateCfaCreation(siret)` -> `GET /etablissement/cfa/:siret/validate-creation`

#### Gestion des erreurs cote front

**Pour ENTREPRISE :**

| Condition                      | Comportement                                       |
| ------------------------------ | -------------------------------------------------- |
| `statusCode >= 500`            | Redirection vers la page detail malgre l'erreur    |
| `errorCode === NON_DIFFUSIBLE` | Erreur sur le champ SIRET                          |
| `errorCode === IS_CFA`         | Erreur + suggestion de lien vers le formulaire CFA |
| Autre erreur 4xx               | Message d'erreur generique                         |

**Pour CFA :**

| Code erreur      | Comportement                                                  |
| ---------------- | ------------------------------------------------------------- |
| `ALREADY_EXISTS` | "Ce numero siret est deja associe a un compte utilisateur."   |
| `NOT_QUALIOPI`   | Erreur + bandeau avec lien vers les organismes certificateurs |
| `CLOSED`         | Erreur + bandeau avec info INSEE                              |
| `UNKNOWN`        | Erreur + bandeau avec lien Carif-Oref                         |
| `UNSUPPORTED`    | Erreur + bandeau avec lien contact email                      |

---

### Etape 4a - Backend : GET /etablissement/entreprise/:siret

#### Fichiers

| Fichier                                                                      | Role                   |
| ---------------------------------------------------------------------------- | ---------------------- |
| `shared/src/routes/recruiters.routes.ts` (L55-76)                            | Definition de la route |
| `server/src/http/controllers/etablissementRecruteur.controller.ts` (L67-103) | Handler                |
| `server/src/services/etablissement.service.ts`                               | Service metier         |
| `server/src/services/cacheInfosSiret.service.ts`                             | Cache SIRET            |
| `server/src/common/apis/apiEntreprise/apiEntreprise.client.ts`               | Client API Entreprise  |
| `server/src/services/organization.service.ts`                                | Upsert entreprise      |

#### Parametres

```
GET /etablissement/entreprise/:siret?cfa_delegated_siret=X&skipUpdate=true
```

| Parametre             | Type             | Description                                                |
| --------------------- | ---------------- | ---------------------------------------------------------- |
| `siret`               | path             | SIRET de l'etablissement (14 chiffres)                     |
| `cfa_delegated_siret` | query, optionnel | SIRET du CFA delegataire                                   |
| `skipUpdate`          | query, optionnel | Si `"true"`, utilise le cache DB au lieu de rappeler l'API |

#### Chaine d'appels

```
Handler
|
+-- [si skipUpdate] --> MongoDB: entreprises.findOne({ siret })
|
+-- [sinon] --> getEntrepriseDataFromSiret({ siret, type: ENTREPRISE })
|   |
|   +-- getSiretInfos(siret)
|   |   +-- MongoDB: cache_siret.findOne({ siret })        <-- cache local
|   |   +-- [si pas en cache] --> API externe:
|   |       GET {api-entreprise}/sirene/etablissements/diffusibles/{siret}
|   |       Verifie: diffusible ? ferme ? NAF = 85xx (CFA) ?
|   |
|   +-- formatEntrepriseData(result)
|   +-- getGeoCoordinates()
|       --> API externe: GET https://data.geopf.fr/geocodage/search
|
+-- upsertEntrepriseData(siret, ...)
|   +-- MongoDB: entreprises.insertOne / findOneAndUpdate
|   +-- MongoDB: recruiters.updateMany (met a jour les recruteurs lies)
|
+-- validateCreationEntrepriseFromCfa()
|   +-- MongoDB: recruiters.findOne({ establishment_siret, cfa_delegated_siret })
|
+-- getEntrepriseHandiEngagement(siret)
    +-- MongoDB: referentiel_engagement_entreprise.findOne({ siret, engagement: "handicap" })
```

#### Reponse

Objet `IEntreprise` enrichi avec `engagementHandicapOrigin` :

```typescript
{
  _id: ObjectId,
  siret: string,
  raison_sociale: string | null,
  enseigne: string | null,
  idcc: number | null,
  address: string | null,
  address_detail: IGlobalAddress,
  geo_coordinates: string | null,     // "latitude,longitude"
  opco: OPCOS_LABEL | null,
  naf_code: string | null,
  naf_label: string | null,
  status: IEntrepriseStatusEvent[],
  engagementHandicapOrigin: string | null,
}
```

#### Erreurs

| Code HTTP | Condition                         | ErrorCode        |
| --------- | --------------------------------- | ---------------- |
| 400       | SIRET invalide ou introuvable     | -                |
| 400       | Entreprise non diffusible         | `NON_DIFFUSIBLE` |
| 400       | Etablissement ferme               | `CLOSED`         |
| 400       | Code NAF 85xx (c'est un CFA)      | `IS_CFA`         |
| 400       | Entreprise deja partenaire du CFA | -                |

---

### Etape 4b - Backend : GET /etablissement/cfa/:siret/validate-creation

#### Fichiers

| Fichier                                                                       | Role                   |
| ----------------------------------------------------------------------------- | ---------------------- |
| `shared/src/routes/recruiters.routes.ts` (L91-99)                             | Definition de la route |
| `server/src/http/controllers/etablissementRecruteur.controller.ts` (L147-164) | Handler                |
| `server/src/services/etablissement.service.ts` (L378-417)                     | Services metier        |
| `server/src/services/cfa.service.ts`                                          | Upsert CFA             |

#### Chaine d'appels

```
Handler
|
+-- isCfaCreationValid(siret)
|   +-- MongoDB: cfas.findOne({ siret })
|   +-- MongoDB: rolemanagements.find({ authorized_type: CFA, authorized_id })
|       Verifie qu'aucun role actif (GRANTED/AWAITING_VALIDATION) n'existe
|
+-- validateEligibilityCfa(siret)
    +-- API externe:
    |   GET https://referentiel.apprentissage.beta.gouv.fr/api/v1/organismes/{siret}
    +-- Verifie: existe ? ouvert ? adresse physique ? Qualiopi ?
    +-- formatReferentielData(referentiel)
    +-- upsertCfa(siret, ...)
        +-- MongoDB: cfas.insertOne / findOneAndUpdate
```

#### Reponse

`200 OK` avec un objet vide `{}` en cas de succes.

#### Erreurs

| Code HTTP | Condition                                     | ErrorCode        |
| --------- | --------------------------------------------- | ---------------- |
| 403       | SIRET deja associe a un compte actif          | `ALREADY_EXISTS` |
| 400       | SIRET absent du referentiel                   | `UNKNOWN`        |
| 400       | Etablissement ferme                           | `CLOSED`         |
| 400       | Pas d'adresse physique (formation a distance) | `UNSUPPORTED`    |
| 400       | Pas de certification Qualiopi                 | `NOT_QUALIOPI`   |

---

### Etape 5 - Redirection vers la page Detail (Front)

#### Fichiers

| Fichier                                                                                                   | Role                          |
| --------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `ui/utils/routes.utils.ts` (L409-417)                                                                     | Configuration route dynamique |
| `ui/app/(espace-pro-creation-compte)/espace-pro/creation/detail/page.tsx`                                 | Page Next.js                  |
| `ui/app/(espace-pro-creation-compte)/_components/InformationCreationCompte/InformationCreationCompte.tsx` | Composant formulaire          |

#### Fonctionnement

Si la validation SIRET reussit, le navigateur redirige vers :

```
/espace-pro/creation/detail?siret={siret}&type=ENTREPRISE&origin=lba
```

(ou `/espace-pro/widget/entreprise/detail?...` en mode widget)

Le composant `InformationCreationCompte` affiche un **formulaire de coordonnees** :

| Champ     | Type   | Obligatoire                                        |
| --------- | ------ | -------------------------------------------------- |
| Nom       | texte  | oui                                                |
| Prenom    | texte  | oui                                                |
| Telephone | texte  | oui                                                |
| Email     | email  | oui                                                |
| OPCO      | select | oui (si ENTREPRISE et non detecte automatiquement) |

---

### Etape 6 - Backend : POST /etablissement/creation

#### Fichiers

| Fichier                                                                       | Role                          |
| ----------------------------------------------------------------------------- | ----------------------------- |
| `shared/src/routes/recruiters.routes.ts` (L135-184)                           | Definition de la route        |
| `server/src/http/controllers/etablissementRecruteur.controller.ts` (L195-289) | Handler                       |
| `server/src/services/etablissement.service.ts` (L419-496)                     | Workflow entreprise           |
| `server/src/services/userRecruteur.service.ts`                                | Creation utilisateur          |
| `server/src/services/organization.service.ts`                                 | Gestion entreprise            |
| `server/src/services/formulaire.service.ts`                                   | Creation formulaire recruteur |
| `server/src/services/cfa.service.ts`                                          | Gestion CFA                   |

#### Body de la requete

```typescript
// Variante ENTREPRISE
{
  type: "ENTREPRISE",
  last_name: string,
  first_name: string,
  phone: string,
  email: string,
  origin: string,
  establishment_siret: string,
  opco: string,
  idcc?: string,
}

// Variante CFA
{
  type: "CFA",
  last_name: string,
  first_name: string,
  phone: string,
  email: string,
  origin: string,
  establishment_siret: string,
  opco?: string,
}
```

#### Reponse

```typescript
{
  formulaire?: IRecruiter,    // Uniquement pour ENTREPRISE
  user: IUserWithAccount,
  token: string,              // JWT pour la suite du parcours
  validated: boolean,         // true si auto-valide, false si en attente
}
```

#### Flux ENTREPRISE

```
entrepriseOnboardingWorkflow.create()
|
+-- Verification: formulaire existant pour siret+email ?
|   +-- MongoDB: recruiters.findOne({ establishment_siret, email })
|   +-- Si oui --> erreur 403 ALREADY_EXISTS
|
+-- Verification: email deja utilise ?
|   +-- MongoDB: userswithaccounts.findOne({ email })
|   +-- Si oui --> erreur 403 ALREADY_EXISTS
|
+-- getEntrepriseDataFromSiret({ siret, type: ENTREPRISE })
|   +-- API SIRENE + geocodage (cf. etape 4a)
|
+-- upsertEntrepriseData(siret, ...)
|   +-- MongoDB: entreprises.insertOne / findOneAndUpdate
|   +-- MongoDB: recruiters.updateMany
|
+-- updateEntrepriseOpco(siret, { opco, idcc })
|   +-- MongoDB: entreprises.findOneAndUpdate (si OPCO pas deja defini)
|
+-- createOrganizationUser()
|   +-- MongoDB: userswithaccounts.insertOne
|   +-- MongoDB: rolemanagements.findOneAndUpdate
|
+-- saveUserTrafficSourceIfAny()
|   +-- MongoDB: trafficSource.insertOne (donnees cookies)
|
+-- autoValidateUserRoleOnCompany()
|   +-- Verifie BAL (Bonne Boite Legacy) / domaine email
|   +-- Si match --> role.status = GRANTED (validation_type = AUTO)
|   +-- Sinon --> role.status = AWAITING_VALIDATION
|
+-- createFormulaire()
|   +-- MongoDB: recruiters.insertOne
|
+-- sendUserConfirmationEmail() [non bloquant]
|   +-- Email de confirmation envoye des la creation du compte entreprise
|   +-- En cas d'echec SMTP: log + Sentry, la creation de compte continue
|
+-- generateDepotSimplifieToken(user, establishment_id)
|   +-- Genere un JWT pour le depot simplifie d'offres
|
+-- Retourne { formulaire, user, token, validated }
```

#### Flux CFA

```
+-- Verification: email existant ?
|   +-- Si oui --> erreur 403
|
+-- validateEligibilityCfa(siret)
|   +-- API Referentiel + upsert CFA (cf. etape 4b)
|
+-- createOrganizationUser()
|   +-- MongoDB: userswithaccounts.insertOne
|   +-- MongoDB: rolemanagements.findOneAndUpdate
|
+-- saveUserTrafficSourceIfAny()
|   +-- MongoDB: trafficSource.insertOne
|
+-- Auto-validation selon les contacts du referentiel :
|   |
|   +-- [Email = contact du referentiel]
|   |   +-- autoValidateUser() --> role.status = GRANTED
|   |   +-- sendUserConfirmationEmail() --> email avec magic link
|   |
|   +-- [Domaine email = domaine contact]
|   |   +-- autoValidateUser() --> role.status = GRANTED
|   |   +-- sendUserConfirmationEmail() --> email avec magic link
|   |
|   +-- [Aucun match / pas de contacts]
|       +-- setUserHasToBeManuallyValidated() --> AWAITING_VALIDATION
|       +-- notifyToSlack() --> "Nouvel OF en attente de validation"
|
+-- generateCfaCreationToken(user)
+-- Retourne { user, token, validated }
```

#### Erreurs

| Code HTTP | Condition                                         | ErrorCode        |
| --------- | ------------------------------------------------- | ---------------- |
| 403       | Email deja associe a un compte                    | `ALREADY_EXISTS` |
| 403       | Formulaire existant pour ce siret+email           | `ALREADY_EXISTS` |
| 400       | SIRET invalide / ferme / non diffusible           | varies           |
| 400       | CFA : pas dans le referentiel, pas Qualiopi, etc. | varies           |

---

### Etape 7 - Apres la creation (Front)

#### Pour ENTREPRISE

Redirection vers la page de **creation de la premiere offre** :

```
/espace-pro/creation/offre?establishment_id={id}&email={email}&userId={id}&token={jwt}&displayBanner=true
```

(ou `/espace-pro/widget/entreprise/offre?...` en mode widget)

#### Pour CFA

| Condition          | Destination                                              |
| ------------------ | -------------------------------------------------------- |
| `validated: true`  | Page de confirmation                                     |
| `validated: false` | Page d'attente `/espace-pro/authentification/en-attente` |

---

## Emails envoyes aux utilisateurs

### Vue d'ensemble par statut

L'envoi des emails depend de deux axes :

- **Le type de compte** : ENTREPRISE ou CFA
- **Le statut de validation** : auto-valide (GRANTED) ou en attente (AWAITING_VALIDATION)

### Comment fonctionne la detection auto-valide / en attente ?

La detection se fait via le champ `validation_type` sur l'evenement de role :

- `validation_type = "AUTOMATIQUE"` : le compte a ete auto-valide (email/domaine reconnu)
- `validation_type = "MANUELLE"` : le compte a ete valide manuellement par un admin ou OPCO

Cette information est utilisee notamment pour decider si l'email de bienvenue et l'email handicap doivent etre envoyes lors de la confirmation d'email (voir `isGrantedAndAutoValidatedRole()` dans `roleManagement.service.ts`).

### Fichiers cles

| Fichier                                          | Role                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `server/src/services/etablissement.service.ts`   | `sendUserConfirmationEmail()`, `sendEmailConfirmationEntreprise()`  |
| `server/src/services/userRecruteur.service.ts`   | `sendWelcomeEmailToUserRecruteur()`                                 |
| `server/src/services/handiEngagement.service.ts` | `sendEngagementHandicapEmailIfNeeded()`                             |
| `server/src/services/roleManagement.service.ts`  | `sendDeactivatedRecruteurMail()`, `isGrantedAndAutoValidatedRole()` |
| `server/src/services/mailer.service.ts`          | Service d'envoi centralise (Brevo/Sendinblue)                       |

---

### ENTREPRISE - Auto-valide (GRANTED)

L'auto-validation se declenche dans `autoValidateUserRoleOnCompany()` si :

- L'email existe dans la base BAL (Bonne Boite Legacy)
- Le domaine email correspond a un email BAL
- L'API BAL valide l'organisation

Quand l'auto-validation est declenchee, l'evenement de role est enregistre avec `validation_type = "AUTOMATIQUE"`.

**Chronologie des emails :**

```
1. POST /etablissement/creation
   +-- Compte cree, role = GRANTED (validation_type = AUTO)
   +-- sendUserConfirmationEmail()
   |   Template : mail-confirmation-email.mjml.ejs
   |   Objet : "Confirmez votre adresse mail"
   |   Contenu : lien magic link de confirmation (validite 30 jours)
   |   Note : envoi non bloquant (echec SMTP journalise, creation conservee)
   +-- Redirection vers /creation/offre (creation 1ere offre)

2. Creation de la premiere offre
   +-- sendEmailConfirmationEntreprise()
   |   Template : mail-nouvelle-offre-depot-simplifie.mjml.ejs
   |   Objet : "Confirmez votre adresse mail"
   |   Contenu : details de l'offre + lien magic link de confirmation
   |   Condition : entreprise VALIDE + 1 seule offre + non delegue
   |
      +-- [OU, si plusieurs offres ou delegue]
         sendUserConfirmationEmail()
         Template : mail-confirmation-email.mjml.ejs
         Objet : "Confirmez votre adresse mail"
         Contenu : lien magic link de confirmation (validite 30 jours)
      +-- Remarque : un second email de confirmation peut etre envoye
         si l'utilisateur n'a pas encore confirme son adresse

3. Clic sur le lien de confirmation --> POST /etablissement/validation
   +-- isGrantedAndAutoValidatedRole() verifie que validation_type = AUTO
   |
   +-- sendWelcomeEmailToUserRecruteur()
   |   Template : mail-bienvenue.mjml.ejs
   |          OU mail-bienvenue-entreprise-sans-offre.mjml.ejs (si aucune offre)
   |   Objet : "Bienvenue sur La bonne alternance"
   |   Contenu : nom etablissement, lien d'acces (magic link 15 min)
   |
   +-- sendEngagementHandicapEmailIfNeeded()
       Template : mail-sensibilisation-handi-engagement.mjml.ejs
       Objet : "Engagez-vous en faveur de l'emploi des personnes en situation de handicap !"
       Condition : uniquement si l'entreprise n'a PAS deja d'engagement handicap
       Contenu : liens Tally (accepter/refuser l'engagement), infos France Travail
```

---

### ENTREPRISE - En attente de validation (AWAITING_VALIDATION)

L'utilisateur est mis en attente si aucune des conditions d'auto-validation n'est remplie.

**Chronologie des emails :**

```
1. POST /etablissement/creation
   +-- Compte cree, role = AWAITING_VALIDATION
   +-- sendUserConfirmationEmail()
   |   Template : mail-confirmation-email.mjml.ejs
   |   Objet : "Confirmez votre adresse mail"
   |   Contenu : lien magic link de confirmation (validite 30 jours)
   |   Note : envoi non bloquant (echec SMTP journalise, creation conservee)
   +-- Redirection vers /creation/offre (creation 1ere offre)

2. Creation de la premiere offre
   +-- sendEmailConfirmationEntreprise()
   |   Template : mail-nouvelle-offre-depot-simplifie.mjml.ejs
   |   Objet : "Confirmez votre adresse mail"
   |   Contenu : details de l'offre + lien confirmation + mention "en attente de validation"
   |   Condition : entreprise VALIDE + 1 seule offre + non delegue
   |
   +-- [OU fallback] sendUserConfirmationEmail()

3. Clic sur le lien de confirmation --> POST /etablissement/validation
   +-- Email marque comme verifie
   +-- PAS d'email de bienvenue (role pas GRANTED, ou validation_type != AUTO)
   +-- PAS d'email handicap

4. Un admin/OPCO valide le compte --> activateUserRole()
   +-- Le role passe a GRANTED (validation_type = MANUELLE)
   +-- Le formulaire recruteur est active
   +-- Les offres sont publiees
   +-- Pas d'email automatique a cette etape
   +-- (L'email de bienvenue sera envoye a la prochaine connexion
   |    si l'email est deja verifie et le role GRANTED)
```

**Job planifie pour les OPCOs :**

```
opcoReminderJob() (cron)
   Template : mail-relance-opco.mjml.ejs
   Objet : "Nouveaux comptes entreprises a valider"
   Destinataire : utilisateurs OPCO (pas le recruteur)
   Contenu : nombre de comptes en attente de validation
```

---

### CFA - Auto-valide (GRANTED)

L'auto-validation CFA se declenche si :

- L'email correspond exactement a un contact du referentiel apprentissage
- OU le domaine email correspond au domaine d'un contact du referentiel (et n'est pas un domaine public type gmail, hotmail, etc.)

**Chronologie des emails :**

```
1. POST /etablissement/creation
   +-- Compte cree, role = GRANTED
   +-- sendUserConfirmationEmail()  <-- IMMEDIAT
       Template : mail-confirmation-email.mjml.ejs
       Objet : "Confirmez votre adresse mail"
       Contenu : nom/prenom, lien magic link de confirmation (30 jours)

2. Clic sur le lien de confirmation --> POST /etablissement/validation
   +-- sendWelcomeEmailToUserRecruteur()
   |   Template : mail-bienvenue.mjml.ejs
   |   Objet : "Bienvenue sur La bonne alternance"
   |   Contenu : nom etablissement, lien d'acces (magic link 15 min)
   |
   +-- sendEngagementHandicapEmailIfNeeded()
       --> NON envoye (uniquement pour ENTREPRISE)
```

---

### CFA - En attente de validation (AWAITING_VALIDATION)

L'utilisateur est mis en attente si l'email ne correspond a aucun contact du referentiel.

**Chronologie des emails :**

```
1. POST /etablissement/creation
   +-- Compte cree, role = AWAITING_VALIDATION
   +-- setUserHasToBeManuallyValidated()
   +-- Notification Slack : "Nouvel OF en attente de validation"
       avec lien vers /espace-pro/administration/users/{userId}
   +-- Aucun email envoye au recruteur

2. Un admin valide le compte
   +-- Le role passe a GRANTED
   +-- Pas d'email automatique a cette etape

3. L'utilisateur se connecte via la page d'authentification
   +-- POST /login/magiclink (voir section Connexion)
   +-- Si l'email n'est pas encore verifie : renvoi de l'email de confirmation
   +-- Si l'email est verifie et role = AWAITING_VALIDATION : message "en attente"

4. Apres validation admin + verification email
   +-- POST /etablissement/validation
   +-- sendWelcomeEmailToUserRecruteur()
   +-- (Pas d'email handicap pour CFA)
```

---

### Email de desactivation (tous types)

Quand un admin ou OPCO desactive un compte :

```
deactivateUserRole()
   +-- sendDeactivatedRecruteurMail()
       Template : mail-compte-desactive.mjml.ejs
       Objet : "Mise a jour de votre compte sur La bonne alternance"
       Contenu : raison de la desactivation, infos etablissement, lien contact
       Destinataire : email de l'utilisateur desactive
```

---

### Emails planifies (crons)

#### Rappel d'expiration d'offres

```
recruiterOfferExpirationReminderJob()
   Frequence : J-7 et J-1 avant expiration
   Template : mail-expiration-offres.mjml.ejs
   Objet : "Votre offre expire demain" / "Votre offre expire dans 7 jours"
   Destinataire : utilisateur recruteur (ENTREPRISE ou CFA)
   Contenu : liste des offres concernees, liens pour supprimer/marquer comme pourvue,
             lien de connexion magic link
   Anti-doublon : champ relance_mail_expiration_J1 / J7 sur l'offre
```

#### Rappel OPCOs (comptes en attente)

```
opcoReminderJob()
   Template : mail-relance-opco.mjml.ejs
   Objet : "Nouveaux comptes entreprises a valider"
   Destinataire : utilisateurs ayant un role OPCO
   Contenu : nombre de comptes ENTREPRISE en attente de validation
```

---

### Tableau recapitulatif des emails

| Email                   | Template                                         | Objet                                 | Destinataire      | Declencheur                                                                                      |
| ----------------------- | ------------------------------------------------ | ------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| Confirmation email      | `mail-confirmation-email.mjml.ejs`               | Confirmez votre adresse mail          | Utilisateur       | ENTREPRISE: immediat a la creation du compte, CFA auto-valide (immediat), ou fallback entreprise |
| Confirmation 1ere offre | `mail-nouvelle-offre-depot-simplifie.mjml.ejs`   | Confirmez votre adresse mail          | Utilisateur       | ENTREPRISE : creation 1ere offre (non delegue)                                                   |
| Bienvenue               | `mail-bienvenue.mjml.ejs`                        | Bienvenue sur La bonne alternance     | Utilisateur       | Clic lien confirmation + role GRANTED + auto-valide                                              |
| Bienvenue (sans offre)  | `mail-bienvenue-entreprise-sans-offre.mjml.ejs`  | Bienvenue sur La bonne alternance     | Utilisateur       | ENTREPRISE sans offres + clic lien confirmation                                                  |
| Engagement handicap     | `mail-sensibilisation-handi-engagement.mjml.ejs` | Engagez-vous en faveur de l'emploi... | Utilisateur       | ENTREPRISE uniquement, apres validation email, si auto-valide et pas d'engagement existant       |
| Compte desactive        | `mail-compte-desactive.mjml.ejs`                 | Mise a jour de votre compte...        | Utilisateur       | Admin/OPCO desactive le compte                                                                   |
| Expiration offre        | `mail-expiration-offres.mjml.ejs`                | Votre offre expire dans X jours       | Utilisateur       | Cron J-7 et J-1                                                                                  |
| Relance OPCO            | `mail-relance-opco.mjml.ejs`                     | Nouveaux comptes a valider            | Utilisateurs OPCO | Cron periodique                                                                                  |
| Connexion               | `mail-connexion.mjml.ejs`                        | Lien de connexion                     | Utilisateur       | Demande de connexion via /login/magiclink                                                        |

---

## Connexion (magic link)

Cette section decrit le flux de connexion via "magic link" (lien envoye par email), utilise par tous les types de comptes.

### Fichiers

| Fichier                                                                    | Role                                       |
| -------------------------------------------------------------------------- | ------------------------------------------ |
| `ui/app/(espace-pro)/espace-pro/authentification/AuthentificationPage.tsx` | Page de connexion (front)                  |
| `server/src/http/controllers/login.controller.ts`                          | Handler `/login/magiclink`                 |
| `server/src/services/login.service.ts`                                     | `controlUserState()`                       |
| `server/src/services/userWithAccount.service.ts`                           | `isUserDisabled()`, `isUserEmailChecked()` |

### Parcours utilisateur

1. L'utilisateur va sur `/espace-pro/authentification`
2. Il saisit son adresse email
3. Le systeme verifie son compte et envoie un lien de connexion par email
4. L'utilisateur clique sur le lien et est connecte

### Ordre des verifications (POST /login/magiclink)

Le backend effectue les verifications dans cet ordre precis :

```
1. L'utilisateur existe-t-il ?
   +-- NON --> erreur "UNKNOWN" (adresse email invalide)

2. Le compte est-il desactive ?
   +-- OUI --> erreur "DISABLED" (compte desactive)

3. L'email est-il verifie ?
   +-- NON --> renvoi de l'email de confirmation + erreur "VERIFY"
       (l'utilisateur recoit un nouveau lien pour verifier son email)

4. Quel est l'etat du role utilisateur ? (controlUserState)
   +-- DESACTIVE --> erreur "DISABLED"
   +-- ACTIF ou EMAIL_VERIFIE :
   |   +-- A un role ADMIN, OPCO ou CFA valide --> OK, envoi du magic link
   |   +-- A un role ENTREPRISE valide (entreprise VALIDE) --> OK, envoi du magic link
   |   +-- Toutes ses entreprises sont DESACTIVEES --> erreur "DISABLED"
   |   +-- Sinon --> erreur "VALIDATION" (en attente de validation)
   +-- Etat inconnu --> erreur 400
```

### Messages affiches cote front

| Code erreur backend | Message affiche a l'utilisateur                                                               |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `UNKNOWN`           | "Adresse email invalide."                                                                     |
| `DISABLED`          | "Le compte utilisateur est desactive" + lien vers le support                                  |
| `VERIFY`            | "Votre adresse n'a pas ete verifiee. Cliquez sur le lien que nous venons de vous transmettre" |
| `VALIDATION`        | "Le compte utilisateur est en attente de validation"                                          |

### Email de connexion

Quand toutes les verifications passent, un email est envoye :

```
Template : mail-connexion.mjml.ejs
Objet : "Lien de connexion"
Contenu : nom/prenom, lien magic link de connexion (validite 15 min)
```

## Reference technique

### Collections MongoDB impliquees

| Collection                          | Role                                                               | Operations                           |
| ----------------------------------- | ------------------------------------------------------------------ | ------------------------------------ |
| `entreprises`                       | Donnees entreprise (SIRET, adresse, NAF, OPCO, statut)             | findOne, insertOne, findOneAndUpdate |
| `cfas`                              | Donnees CFA (SIRET, raison sociale, adresse, geoloc)               | findOne, insertOne, findOneAndUpdate |
| `userswithaccounts`                 | Comptes utilisateurs (email, nom, prenom, telephone)               | findOne, insertOne                   |
| `rolemanagements`                   | Droits d'acces (user vers entreprise/CFA, statut GRANTED/AWAITING) | find, findOneAndUpdate               |
| `recruiters`                        | Formulaires recruteur (SIRET, offres, statut)                      | findOne, insertOne, updateMany       |
| `cache_siret`                       | Cache des reponses API SIRENE                                      | findOne, updateOne                   |
| `referentiel_engagement_entreprise` | Engagements handicap                                               | findOne                              |
| `trafficSource`                     | Source de trafic (cookies)                                         | insertOne                            |

---

### APIs externes appelees

| API                             | Endpoint                                                                       | Appelant | Usage                                |
| ------------------------------- | ------------------------------------------------------------------------------ | -------- | ------------------------------------ |
| Recherche Entreprises (gouv.fr) | `GET https://recherche-entreprises.api.gouv.fr/search`                         | Front    | Autocomplete SIRET                   |
| API Entreprise (SIRENE)         | `GET {baseUrl}/sirene/etablissements/diffusibles/{siret}`                      | Back     | Donnees etablissement                |
| GeoPF (geocodage)               | `GET https://data.geopf.fr/geocodage/search`                                   | Back     | Geocodage adresse vers coordonnees   |
| Referentiel Apprentissage       | `GET https://referentiel.apprentissage.beta.gouv.fr/api/v1/organismes/{siret}` | Back     | Validation CFA + donnees referentiel |
| France Competences              | Endpoint interne                                                               | Back     | Detection OPCO                       |

---

### Schema du flux complet

```
[Utilisateur]
    |
    v
Page /espace-pro/creation/entreprise
    |
    v
CreationCompte (type=ENTREPRISE)
    |
    +-- SiretAutocomplete
    |   |
    |   +-- Saisie utilisateur
    |   +-- GET recherche-entreprises.api.gouv.fr/search -----> [API Gouv]
    |   +-- Affichage resultats + selection
    |
    +-- Submit SIRET
        |
        +-- GET /etablissement/entreprise/:siret -----------> [Backend]
        |   |                                                     |
        |   |   +-- cache_siret.findOne --------> [MongoDB]       |
        |   |   +-- API SIRENE -----------------> [API Gouv]      |
        |   |   +-- Geocodage ------------------> [GeoPF]         |
        |   |   +-- entreprises.upsert ---------> [MongoDB]       |
        |   |   +-- Verif handicap -------------> [MongoDB]       |
        |   |                                                     |
        |   +-- <-- Reponse IEntreprise                           |
        |
        +-- [Si OK] Redirection vers /creation/detail
            |
            v
    Page /espace-pro/creation/detail
        |
        +-- Formulaire: Nom, Prenom, Tel, Email, OPCO
        |
        +-- Submit
            |
            +-- POST /etablissement/creation ---------------> [Backend]
            |   |                                                 |
            |   |   +-- API SIRENE + geocodage                    |
            |   |   +-- entreprises.upsert ---------> [MongoDB]   |
            |   |   +-- userswithaccounts.insert ----> [MongoDB]  |
            |   |   +-- rolemanagements.upsert ------> [MongoDB]  |
            |   |   +-- recruiters.insert -----------> [MongoDB]  |
            |   |   +-- Auto-validation role                      |
            |   |   +-- Generation token JWT                      |
            |   |                                                 |
            |   +-- <-- { formulaire, user, token, validated }    |
            |
            +-- [Si ENTREPRISE] Redirection vers /creation/offre
            +-- [Si CFA valide] Page de confirmation
            +-- [Si CFA non valide] Page d'attente
```
