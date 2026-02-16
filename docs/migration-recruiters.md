# Jobs à migrer

- server/src/jobs/anonymization/anonimizeUsersWithAccounts.ts
- server/src/jobs/anonymization/anonymizeIndividual.ts
- server/src/jobs/database/obfuscateCollections.ts
- server/src/jobs/miseEnRelation/sendMiseEnRelation.ts
  => A convertir en jobs_partners
- server/src/jobs/recruiters/cancelOfferJob.ts
  => déjà présent pour jobs_partners
- server/src/jobs/recruiters/recruiterOfferExpirationReminderJob.ts
  => A convertir en jobs_partners
- server/src/jobs/recruiters/updateSiretInfosInErrorJob.ts

# Services et controllers

- server/src/http/controllers/etablissementRecruteur.controller.ts
- server/src/http/controllers/formulaire.controller.ts
- server/src/http/controllers/jobs.controller.ts
- server/src/http/controllers/user.controller.ts
- server/src/http/controllers/v2/jobs.controller.v2.ts
- server/src/security/authorisationService.ts
- server/src/services/application.service.ts
- server/src/services/etablissement.service.ts
- server/src/services/formulaire.service.ts
- server/src/services/lbajob.service.ts
- server/src/services/organization.service.ts
- server/src/services/roleManagement.service.ts
- server/src/services/sitemap.service.ts
- server/src/services/user.service.ts
- server/src/services/userRecruteur.service.ts
- server/src/services/userWithAccount.service.ts
