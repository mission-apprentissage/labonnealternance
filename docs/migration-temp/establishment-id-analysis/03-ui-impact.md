# UI-Side Usage of `establishment_id` in La Bonne Alternance

This document provides a comprehensive analysis of how `establishment_id` is used throughout the UI codebase (Next.js frontend) of La Bonne Alternance.

---

## 1. React Components Using `establishment_id`

The following 12 components directly use `establishment_id`:

### 1.1 MiseEnRelation.tsx

**File:** `/ui/app/(espace-pro)/_components/MiseEnRelation.tsx`

| Line | Usage                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------- |
| 127  | Component prop definition: `{ establishment_id, job_id, token }`                               |
| 134  | Query enabled condition: `enabled: !!establishment_id`                                         |
| 135  | API call: `getFormulaireByToken(establishment_id, token)` or `getFormulaire(establishment_id)` |

```typescript
export default function MiseEnRelation({ establishment_id, job_id, token }: { establishment_id: string; job_id: string; token?: string }) {
  // ...
  const { data: formulaire, isLoading: isFormulaireLoading } = useQuery({
    queryKey: ["formulaire"],
    enabled: !!establishment_id,
    queryFn: () => (token ? getFormulaireByToken(establishment_id, token) : getFormulaire(establishment_id)),
  })
```

---

### 1.2 DetailEntreprise.tsx

**File:** `/ui/app/(espace-pro)/espace-pro/(connected)/_components/DetailEntreprise.tsx`

| Line | Usage                                                                                   |
| ---- | --------------------------------------------------------------------------------------- |
| 107  | API call in mutation: `updateEntrepriseCFA(userRecruteur.establishment_id, {...})`      |
| 153  | Route navigation: `PAGES.dynamic.backCfaPageEntreprise(userRecruteur.establishment_id)` |
| 309  | Building offer edition URL: `establishment_id: userRecruteur.establishment_id`          |

```typescript
if (user.type === AUTHTYPE.CFA) {
  const { email, first_name, last_name, phone } = values
  await updateEntrepriseCFA(userRecruteur.establishment_id, { email, first_name, last_name, phone })
}
```

---

### 1.3 CfaHomeEntrepriseMenu.tsx

**File:** `/ui/app/(espace-pro)/espace-pro/(connected)/_components/CfaHomeEntrepriseMenu.tsx`

| Line | Usage                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------- |
| 20   | Navigation link building: `PAGES.dynamic.backCfaPageEntreprise(row.establishment_id).getPath()` |

```typescript
const actions: PopoverMenuAction[] = [
  {
    label: "Voir les offres",
    ariaLabel: `Voir les offres de l'entreprise ${row.establishment_raison_sociale}`,
    link: PAGES.dynamic.backCfaPageEntreprise(row.establishment_id).getPath(),
    type: "link",
  },
  // ...
]
```

---

### 1.4 ListeOffres.tsx

**File:** `/ui/app/(espace-pro)/espace-pro/(connected)/_components/ListeOffres.tsx`

| Line | Usage                                                                                      |
| ---- | ------------------------------------------------------------------------------------------ |
| 20   | Component prop: `establishment_id: string`                                                 |
| 28   | Query enabled condition: `enabled: !!establishment_id`                                     |
| 29   | API call: `getFormulaire(establishment_id)`                                                |
| 46   | Route building: `offreUpsert({ offerId, establishment_id, userType: user.type })`          |
| 50   | Route building for creation: `offreUpsert({ offerId: "creation", establishment_id, ... })` |
| 61   | Route building for modification: `modificationEntreprise(user.type, establishment_id)`     |

```typescript
export default function ListeOffres({ hideModify = false, showStats = false, establishment_id }: { hideModify?: boolean; showStats?: boolean; establishment_id: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["offre-liste"],
    enabled: !!establishment_id,
    queryFn: () => getFormulaire(establishment_id),
  })
```

---

### 1.5 FormulaireEditionOffre.tsx

**File:** `/ui/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffre.tsx`

| Line | Usage                                              |
| ---- | -------------------------------------------------- |
| 23   | Optional prop: `establishment_id?: string`         |
| 75   | Guard check: `if (!establishment_id) return <></>` |

```typescript
export const FormulaireEditionOffre = ({ offre, establishment_id, handleSave }: { offre?: IJobJson; establishment_id?: string; handleSave?: (values: any) => void }) => {
  // ...
  if (!establishment_id) return <></>
```

---

### 1.6 UpsertOffre.tsx

**File:** `/ui/app/(espace-pro)/espace-pro/(connected)/_components/UpsertOffre.tsx`

| Line | Usage                                                                   |
| ---- | ----------------------------------------------------------------------- |
| 11   | Component prop: `establishment_id: string`                              |
| 31   | API call for creating offers: `createOffre(establishment_id, values)`   |
| 41   | Passed to FormulaireEditionOffre: `establishment_id={establishment_id}` |

```typescript
export default function UpsertOffre({ establishment_id, job_id, onSuccess }: { establishment_id: string; job_id?: string; onSuccess: () => void }) {
  // ...
  await createOffre(establishment_id, values)
```

---

### 1.7 BackEntrepriseUpsertOffre.tsx

**File:** `/ui/app/(espace-pro)/espace-pro/(connected)/_components/BackEntrepriseUpsertOffre.tsx`

| Line | Usage                                                                                   |
| ---- | --------------------------------------------------------------------------------------- |
| 12   | Component prop: `establishment_id: string`                                              |
| 18   | Breadcrumb route building: `offreUpsert({ establishment_id, offerId: job_id, ... })`    |
| 20   | Passed to UpsertOffre: `establishment_id={establishment_id}`                            |
| 22   | Success redirect: `successEditionOffre({ userType: user.type, establishment_id, ... })` |

```typescript
export function BackEntrepriseUpsertOffre({ establishment_id, job_id }: { establishment_id: string; job_id?: string }) {
```

---

### 1.8 ConfirmationSuppressionEntreprise.tsx

**File:** `/ui/app/(espace-pro)/espace-pro/(connected)/_components/ConfirmationSuppressionEntreprise.tsx`

| Line | Usage                                                              |
| ---- | ------------------------------------------------------------------ |
| 13   | Interface prop: `establishment_id: string`                         |
| 17   | Destructured from props: `const { ..., establishment_id } = props` |
| 21   | API call: `archiveFormulaire(establishment_id)`                    |

```typescript
interface ConfirmationSuppressionEntrepriseProps {
  isOpen: boolean
  onClose: () => void
  establishment_raison_sociale?: string
  establishment_id: string
}

export function ConfirmationSuppressionEntreprise(props: ConfirmationSuppressionEntrepriseProps) {
  const { isOpen, onClose, establishment_raison_sociale, establishment_id } = props
  // ...
  const SupprimerFormulaire = () => {
    archiveFormulaire(establishment_id)
```

---

### 1.9 CfaHome.tsx (ListeEntreprise)

**File:** `/ui/app/(espace-pro)/espace-pro/(connected)/_components/CfaHome.tsx`

| Line | Usage                                                                                       |
| ---- | ------------------------------------------------------------------------------------------- |
| 118  | Table cell accessor: `const { ..., establishment_id, ... } = data[id]`                      |
| 124  | Link building: `PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath()`            |
| 137  | Link building (fallback): `PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath()` |
| 208  | Confirmation modal prop: `establishment_id={currentEntreprise.establishment_id}`            |

```typescript
const { establishment_raison_sociale, establishment_siret, establishment_id, opco } = data[id]
return (
  <Box sx={{ display: "flex", flexDirection: "column" }}>
    <Link
      underline="hover"
      href={PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath()}
```

---

### 1.10 DepotSimplifieCreationOffre.tsx

**File:** `/ui/app/(espace-pro-creation-compte)/_components/DepotSimplifieCreationOffre.tsx`

| Line | Usage                                                                                     |
| ---- | ----------------------------------------------------------------------------------------- |
| 14   | Extracted from search params: `const { ..., establishment_id } = useSearchParamsRecord()` |
| 18   | API call: `createOffreByToken(establishment_id, values, token)`                           |
| 42   | Passed to FormulaireEditionOffre: `establishment_id={establishment_id}`                   |

```typescript
export function DepotSimplifieCreationOffre() {
  const router = useRouter()
  const { displayBanner, userId, establishment_id } = useSearchParamsRecord()
  // ...
  const { recruiter: formulaire, token: jobToken } = await createOffreByToken(establishment_id, values, token)
```

---

### 1.11 InformationCreationCompte.tsx

**File:** `/ui/app/(espace-pro-creation-compte)/_components/InformationCreationCompte/InformationCreationCompte.tsx`

| Line    | Usage                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------- |
| 214-215 | Redirecting with establishment_id: `espaceProCreationOffre({ establishment_id: formulaire.establishment_id, ... })` |

```typescript
router.push(
  PAGES.dynamic
    .espaceProCreationOffre({
      establishment_id: formulaire.establishment_id,
      type,
      email: user.email,
      // ...
    })
    .getPath()
)
```

---

### 1.12 ExportButton/ExportButtonNew.tsx

**File:** `/ui/components/espace_pro/ExportButton/ExportButtonNew.tsx`

Uses `establishment_id` for export functionality (based on grep results).

---

## 2. API Calls in `ui/utils/api.ts`

The following 7 functions use `establishment_id` as a parameter:

| Function               | Line    | Endpoint                                            | Parameter Usage                                 |
| ---------------------- | ------- | --------------------------------------------------- | ----------------------------------------------- |
| `getDelegationDetails` | 32      | `GET /formulaire/delegation/:establishment_id`      | `params: { establishment_id }`                  |
| `getFormulaire`        | 34      | `GET /formulaire/:establishment_id`                 | `params: { establishment_id }`                  |
| `getFormulaireByToken` | 35-36   | `GET /formulaire/:establishment_id/by-token`        | `params: { establishment_id }`                  |
| `archiveFormulaire`    | 38      | `DELETE /formulaire/:establishment_id`              | `params: { establishment_id }`                  |
| `createOffre`          | 44-45   | `POST /formulaire/:establishment_id/offre`          | `params: { establishment_id }`                  |
| `createOffreByToken`   | 46-47   | `POST /formulaire/:establishment_id/offre/by-token` | `params: { establishment_id }`                  |
| `updateEntrepriseCFA`  | 114-116 | `POST /formulaire/:establishment_id/informations`   | `params: { establishment_id: establishmentId }` |

### Detailed API Function Signatures

```typescript
// Line 32-33
export const getDelegationDetails = async (establishment_id: string, token: string) =>
  apiGet("/formulaire/delegation/:establishment_id", { params: { establishment_id }, headers: { authorization: `Bearer ${token}` } })

// Line 34
export const getFormulaire = async (establishment_id: string) => apiGet("/formulaire/:establishment_id", { params: { establishment_id } })

// Line 35-36
export const getFormulaireByToken = async (establishment_id: string, token: string) =>
  apiGet("/formulaire/:establishment_id/by-token", { params: { establishment_id }, headers: { authorization: `Bearer ${token}` } })

// Line 38
export const archiveFormulaire = async (establishment_id: string) => apiDelete("/formulaire/:establishment_id", { params: { establishment_id } })

// Line 44-45
export const createOffre = async (establishment_id: string, newOffre: IJobCreate) =>
  apiPost("/formulaire/:establishment_id/offre", { params: { establishment_id }, body: newOffre })

// Line 46-47
export const createOffreByToken = async (establishment_id: string, newOffre: IJobCreate, token: string) =>
  apiPost("/formulaire/:establishment_id/offre/by-token", { params: { establishment_id }, body: newOffre, headers: { authorization: `Bearer ${token}` } })

// Line 114-116
export const updateEntrepriseCFA = async (establishmentId: string, values: IBody<IRoutes["post"]["/formulaire/:establishment_id/informations"]>) => {
  await apiPost("/formulaire/:establishment_id/informations", { params: { establishment_id: establishmentId }, body: values })
}
```

---

## 3. URL Routes from `routes.utils.ts`

**File:** `/ui/utils/routes.utils.ts`

The following route builders use `establishment_id`:

### 3.1 `modificationEntreprise` (Lines 276-281)

```typescript
modificationEntreprise: (userType: string, establishment_id?: string): IPage => ({
  getPath: () => (userType === "CFA" ? `/espace-pro/cfa/entreprise/${establishment_id}/informations` : "/espace-pro/entreprise/compte"),
  // ...
})
```

**Generated Paths:**

- CFA: `/espace-pro/cfa/entreprise/${establishment_id}/informations`
- Other types: `/espace-pro/entreprise/compte` (no establishment_id)

---

### 3.2 `offreUpsert` (Lines 282-316)

```typescript
offreUpsert: ({
  offerId,
  establishment_id,
  userType,
  userId,
  raison_sociale,
}: { ... }): IPage => {
  const isCreation = offerId === "creation"
  return {
    getPath: () => {
      switch (userType) {
        case OPCO:
          return `/espace-pro/opco/users/${userId}/entreprise/${establishment_id}/offre/${offerId}${raisonSocialeParam}`
        case CFA:
          return isCreation
            ? PAGES.dynamic.backCfaEntrepriseCreationOffre(establishment_id).getPath()
            : `/espace-pro/cfa/entreprise/${establishment_id}/offre/${offerId}`
        case ENTREPRISE:
          return isCreation
            ? PAGES.static.backEntrepriseCreationOffre.getPath()
            : PAGES.dynamic.backEntrepriseEditionOffre({ job_id: offerId }).getPath()
        case ADMIN:
          return `/espace-pro/administration/users/${userId}/entreprise/${establishment_id}/offre/${offerId}${raisonSocialeParam}`
      }
    },
  }
}
```

**Generated Paths by User Type:**

- OPCO: `/espace-pro/opco/users/${userId}/entreprise/${establishment_id}/offre/${offerId}`
- CFA (creation): `/espace-pro/cfa/entreprise/${establishment_id}/creation-offre`
- CFA (edition): `/espace-pro/cfa/entreprise/${establishment_id}/offre/${offerId}`
- ENTREPRISE: Does not use establishment_id in URL
- ADMIN: `/espace-pro/administration/users/${userId}/entreprise/${establishment_id}/offre/${offerId}`

---

### 3.3 `espaceProCreationOffre` (Lines 352-368)

```typescript
espaceProCreationOffre: (props: {
  establishment_id: string
  type: "CFA" | "ENTREPRISE"
  email: string
  userId: string
  token: string
  displayBanner: boolean
  isWidget: boolean
}): IPage => ({
  getPath: () => {
    const { isWidget, displayBanner, ...querystring } = props
    return generateUri(isWidget ? "/espace-pro/widget/entreprise/offre" : "/espace-pro/creation/offre", {
      querystring: { ...querystring, displayBanner: displayBanner.toString() },
    }) as string
  },
})
```

**Generated Path:** `/espace-pro/creation/offre?establishment_id=xxx&type=xxx&...` (as query parameter)

---

### 3.4 `successEditionOffre` (Lines 317-342)

```typescript
successEditionOffre: ({ userType, establishment_id, user_id }: { userType: "OPCO" | "ENTREPRISE" | "CFA" | "ADMIN"; establishment_id?: string; user_id?: string }): IPage => {
  let path = ""
  switch (userType) {
    case "OPCO":
      path = `/espace-pro/opco/entreprise/${user_id}/entreprise/${establishment_id}`
      break
    // ...
  }
}
```

**Note:** Only OPCO type uses `establishment_id` in this route.

---

### 3.5 `backCfaPageEntreprise` (Lines 466-469)

```typescript
backCfaPageEntreprise: (establishment_id: string, establishmentLabel?: string): IPage => ({
  getPath: () => `/espace-pro/cfa/entreprise/${establishment_id}` as string,
  title: establishmentLabel ?? "Entreprise",
})
```

**Generated Path:** `/espace-pro/cfa/entreprise/${establishment_id}`

---

### 3.6 `backCfaPageInformations` (Lines 470-473)

```typescript
backCfaPageInformations: (establishment_id: string): IPage => ({
  getPath: () => `/espace-pro/cfa/entreprise/${establishment_id}/informations` as string,
  title: "Informations de contact",
})
```

**Generated Path:** `/espace-pro/cfa/entreprise/${establishment_id}/informations`

---

### 3.7 `backCfaEntrepriseCreationOffre` (Lines 474-477)

```typescript
backCfaEntrepriseCreationOffre: (establishment_id: string): IPage => ({
  getPath: () => `/espace-pro/cfa/entreprise/${establishment_id}/creation-offre` as string,
  title: "Creation d'une offre",
})
```

**Generated Path:** `/espace-pro/cfa/entreprise/${establishment_id}/creation-offre`

---

## 4. Page Routes with `[establishment_id]` URL Segments

The following Next.js pages use `establishment_id` as a dynamic route segment:

### 4.1 CFA Enterprise Pages

| Page                      | File Path                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| Enterprise Details        | `/ui/app/(espace-pro)/espace-pro/(connected)/cfa/entreprise/[establishment_id]/page.tsx`                |
| Enterprise Informations   | `/ui/app/(espace-pro)/espace-pro/(connected)/cfa/entreprise/[establishment_id]/informations/page.tsx`   |
| Enterprise Creation Offre | `/ui/app/(espace-pro)/espace-pro/(connected)/cfa/entreprise/[establishment_id]/creation-offre/page.tsx` |
| Enterprise Offer Edition  | `/ui/app/(espace-pro)/espace-pro/(connected)/cfa/entreprise/[establishment_id]/offre/[jobId]/page.tsx`  |

### 4.2 From-Mail Pages

| Page             | File Path                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Mise en Relation | `/ui/app/(espace-pro)/espace-pro/(from-mail)/mise-en-relation/[establishment_id]/[job_id]/page.tsx` |

### 4.3 OPCO Pages

| Page                       | File Path                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| OPCO User Enterprise Offer | `/ui/app/(espace-pro)/espace-pro/(connected)/opco/users/[userId]/entreprise/[establishment_id]/offre/[jobId]/page.tsx` |

### 4.4 Administration Pages

| Page                        | File Path                                                                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Admin User Enterprise Offer | `/ui/app/(espace-pro)/espace-pro/(connected)/administration/users/[userId]/entreprise/[establishment_id]/offre/[job_id]/page.tsx` |

### Page Implementation Examples

**CFA Enterprise Page (`/cfa/entreprise/[establishment_id]/page.tsx`):**

```typescript
export default function Page() {
  const { establishment_id } = useParams() as { establishment_id: string }

  const { data: recruiter, isLoading } = useQuery({
    queryKey: ["recruiter", establishment_id],
    enabled: Boolean(establishment_id),
    queryFn: () => getFormulaire(establishment_id),
  })
  // ...
  return <ListeOffres showStats={true} establishment_id={establishment_id} />
}
```

**OPCO User Enterprise Offer Page:**

```typescript
export default function Page() {
  const { userId, establishment_id, jobId } = useParams() as { userId: string; establishment_id: string; jobId: string }
  // ...
  return <UpsertOffre establishment_id={establishment_id} job_id={jobId} onSuccess={...} />
}
```

---

## 5. State Management and React Query

### 5.1 Query Key Dependencies

`establishment_id` is used as a query key dependency in several components:

```typescript
// In CFA Enterprise pages
const { data: recruiter } = useQuery({
  queryKey: ["recruiter", establishment_id], // Query key includes establishment_id
  enabled: Boolean(establishment_id),
  queryFn: () => getFormulaire(establishment_id),
})

// In ListeOffres
const { data } = useQuery({
  queryKey: ["offre-liste"],
  enabled: !!establishment_id, // Query is disabled until establishment_id is available
  queryFn: () => getFormulaire(establishment_id),
})

// In MiseEnRelation
const { data: formulaire } = useQuery({
  queryKey: ["formulaire"],
  enabled: !!establishment_id, // Query is disabled until establishment_id is available
  queryFn: () => getFormulaireByToken(establishment_id, token),
})
```

### 5.2 Extracted from URL Parameters

In Next.js pages, `establishment_id` is extracted using `useParams()`:

```typescript
const { establishment_id } = useParams() as { establishment_id: string }
```

### 5.3 Extracted from Search Parameters

In some components (e.g., account creation flow), `establishment_id` is extracted from URL query parameters:

```typescript
const { establishment_id } = useSearchParamsRecord()
```

### 5.4 Passed as Props Through Component Hierarchy

`establishment_id` flows through the component hierarchy:

```
Page (extracts from URL)
  -> ListeOffres (receives as prop)
    -> OffresTabs (receives establishment_id indirectly via buildOfferEditionUrl callback)

Page (extracts from URL)
  -> UpsertOffre (receives as prop)
    -> FormulaireEditionOffre (receives as prop)
```

---

## 6. What is NOT Displayed to Users

**Important:** `establishment_id` is **never shown to end users**. It is purely an internal identifier used for:

1. **URL routing** - Building navigation paths
2. **API calls** - Identifying which establishment to fetch/modify
3. **Query caching** - Uniquely identifying cached data

### User-Facing Information

Instead of `establishment_id`, the UI displays:

| Internal Field                 | User-Facing Display | Example Usage                                    |
| ------------------------------ | ------------------- | ------------------------------------------------ |
| `establishment_raison_sociale` | Company name        | Displayed in page titles, tables, breadcrumbs    |
| `establishment_siret`          | SIRET number        | Displayed as "SIRET {number}" in company details |

### Example from CfaHome.tsx (Lines 118-146):

```typescript
const { establishment_raison_sociale, establishment_siret, establishment_id, opco } = data[id]
return (
  <Box>
    <Link href={PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath()}>
      {establishment_raison_sociale}  {/* User sees the company name */}
    </Link>
    <Typography>SIRET {establishment_siret}</Typography>  {/* User sees the SIRET */}
    {/* establishment_id is ONLY used for building the URL, never displayed */}
  </Box>
)
```

### Example from DetailEntreprise.tsx (Line 128):

```typescript
const establishmentLabel = userRecruteur.establishment_raison_sociale ?? userRecruteur.establishment_siret
// Used for display - falls back to SIRET if company name is not available
```

---

## Summary

| Category         | Count | Key Files                                                        |
| ---------------- | ----- | ---------------------------------------------------------------- |
| React Components | 12    | MiseEnRelation, ListeOffres, UpsertOffre, CfaHome, etc.          |
| API Functions    | 7     | getFormulaire, createOffre, archiveFormulaire, etc.              |
| Route Builders   | 7     | backCfaPageEntreprise, offreUpsert, modificationEntreprise, etc. |
| Dynamic Pages    | 7     | CFA, OPCO, Admin, and from-mail pages                            |

The `establishment_id` is a critical internal identifier that:

- Links UI components to specific establishments in the backend
- Forms the basis of URL routing for CFA, OPCO, and Admin interfaces
- Is used as a React Query cache key for data invalidation
- Is **never exposed** to end users in the interface
