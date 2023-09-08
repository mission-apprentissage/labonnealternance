/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute, HttpStatusCodeLiteral, TsoaResponse, fetchMiddlewares } from "@tsoa/runtime"
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AppointmentsController } from "./../http/controllers/appointments/appointments.controller.js"
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { JobsController } from "./../http/controllers/jobs/jobs.controller.js"
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MetiersController } from "./../http/controllers/metiers/metiers.controller.js"
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MetiersDAvenirController } from "./../http/controllers/metiersdavenir/metiersDAvenir.controller.js"
import { expressAuthentication } from "./../http/authentication.js"
// @ts-ignore - no great way to install types from subpackage
import promiseAny from "promise.any"
import type { RequestHandler, Router } from "express"

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
  TCreateContextResponse: {
    dataType: "refAlias",
    type: {
      dataType: "nestedObjectLiteral",
      nestedProperties: {
        form_url: { dataType: "string", required: true },
        cle_ministere_educatif: { dataType: "string", required: true },
        id_rco_formation: { dataType: "string", required: true },
        localite: { dataType: "string", required: true },
        cfd: { dataType: "string", required: true },
        etablissement_formateur_siret: { dataType: "string", required: true },
        code_postal: { dataType: "string", required: true },
        lieu_formation_adresse: { dataType: "string", required: true },
        intitule_long: { dataType: "string", required: true },
        etablissement_formateur_entreprise_raison_sociale: { dataType: "string", required: true },
      },
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  TCreateContextResponseError: {
    dataType: "refAlias",
    type: { dataType: "nestedObjectLiteral", nestedProperties: { error: { dataType: "string", required: true } }, validators: {} },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  TCreateContextBody: {
    dataType: "refAlias",
    type: {
      dataType: "nestedObjectLiteral",
      nestedProperties: {
        referrer: { dataType: "string", required: true },
        trainingHasJob: { dataType: "boolean" },
        idCleMinistereEducatif: { dataType: "string" },
        idActionFormation: { dataType: "string" },
        idRcoFormation: { dataType: "string" },
        idParcoursup: { dataType: "string" },
      },
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  TResponseError: {
    dataType: "refAlias",
    type: {
      dataType: "nestedObjectLiteral",
      nestedProperties: { message: { dataType: "string", required: true }, error: { dataType: "boolean", required: true } },
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Academie: {
    dataType: "refObject",
    properties: {
      code: { dataType: "string", required: true },
      nom: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IGeometry: {
    dataType: "refObject",
    properties: {
      coordinates: { dataType: "array", array: { dataType: "double" }, required: true },
      type: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IProperties: {
    dataType: "refObject",
    properties: {
      score: { dataType: "double", required: true },
      source: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Geojson: {
    dataType: "refObject",
    properties: {
      geometry: { ref: "IGeometry", required: true },
      properties: { ref: "IProperties", required: true },
      type: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  AcheminementPostal: {
    dataType: "refObject",
    properties: {
      l1: { dataType: "string", required: true },
      l2: { dataType: "string", required: true },
      l3: { dataType: "string", required: true },
      l4: { dataType: "string", required: true },
      l5: { dataType: "string", required: true },
      l6: { dataType: "string", required: true },
      l7: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IAdresseCFA: {
    dataType: "refObject",
    properties: {
      academie: { ref: "Academie", required: true },
      code_insee: { dataType: "string", required: true },
      code_postal: { dataType: "string", required: true },
      departement: { ref: "Academie", required: true },
      geojson: { ref: "Geojson", required: true },
      label: { dataType: "string", required: true },
      localite: { dataType: "string", required: true },
      region: { ref: "Academie", required: true },
      acheminement_postal: { ref: "AcheminementPostal" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IAdresseV2: {
    dataType: "refObject",
    properties: {
      l1: { dataType: "string", required: true },
      l2: { dataType: "string", required: true },
      l3: { dataType: "string", required: true },
      l4: { dataType: "string", required: true },
      l5: { dataType: "string", required: true },
      l6: { dataType: "string", required: true },
      l7: { dataType: "string", required: true },
      numero_voie: { dataType: "string", required: true },
      type_voie: { dataType: "string", required: true },
      nom_voie: { dataType: "string", required: true },
      complement_adresse: { dataType: "string", required: true },
      code_postal: { dataType: "string", required: true },
      localite: { dataType: "string", required: true },
      code_insee_localite: { dataType: "string", required: true },
      cedex: { dataType: "enum", enums: [null], required: true },
      acheminement_postal: { ref: "AcheminementPostal" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IAdresseV3: {
    dataType: "refObject",
    properties: {
      status_diffusion: { dataType: "string", required: true },
      complement_adresse: { dataType: "string", required: true },
      numero_voie: { dataType: "string", required: true },
      indice_repetition_voie: { dataType: "string", required: true },
      type_voie: { dataType: "string", required: true },
      libelle_voie: { dataType: "string", required: true },
      code_postal: { dataType: "string", required: true },
      libelle_commune: { dataType: "string", required: true },
      libelle_commune_etranger: { dataType: "string", required: true },
      distribution_speciale: { dataType: "string", required: true },
      code_commune: { dataType: "string", required: true },
      code_cedex: { dataType: "string", required: true },
      libelle_cedex: { dataType: "string", required: true },
      code_pays_etranger: { dataType: "string", required: true },
      libelle_pays_etranger: { dataType: "string", required: true },
      acheminement_postal: { ref: "AcheminementPostal" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IGlobalAddress: {
    dataType: "refAlias",
    type: { dataType: "union", subSchemas: [{ ref: "IAdresseCFA" }, { ref: "IAdresseV2" }, { ref: "IAdresseV3" }], validators: {} },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  JOB_STATUS: {
    dataType: "refEnum",
    enums: ["Active", "Pourvue", "Annulée", "En attente"],
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IDelegation: {
    dataType: "refObject",
    properties: {
      siret_code: { dataType: "string", required: true },
      email: { dataType: "string", required: true },
      cfa_read_company_detail_at: { dataType: "union", subSchemas: [{ dataType: "datetime" }, { dataType: "string" }], required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IJobs: {
    dataType: "refObject",
    properties: {
      _id: { dataType: "string", required: true },
      rome_label: { dataType: "string", required: true },
      rome_appellation_label: { dataType: "string", required: true },
      job_level_label: { dataType: "string" },
      job_description: { dataType: "string" },
      job_employer_description: { dataType: "string" },
      job_start_date: { dataType: "union", subSchemas: [{ dataType: "datetime" }, { dataType: "string" }] },
      rome_code: { dataType: "array", array: { dataType: "string" }, required: true },
      rome_detail: { dataType: "object", required: true },
      job_creation_date: { dataType: "union", subSchemas: [{ dataType: "datetime" }, { dataType: "string" }], required: true },
      job_expiration_date: { dataType: "union", subSchemas: [{ dataType: "datetime" }, { dataType: "string" }] },
      job_update_date: { dataType: "union", subSchemas: [{ dataType: "datetime" }, { dataType: "string" }], required: true },
      job_last_prolongation_date: { dataType: "union", subSchemas: [{ dataType: "datetime" }, { dataType: "string" }], required: true },
      job_prolongation_count: { dataType: "double", required: true },
      job_status: { ref: "JOB_STATUS" },
      job_status_comment: { dataType: "string", required: true },
      job_type: { dataType: "array", array: { dataType: "string" } },
      is_multi_published: { dataType: "boolean", required: true },
      is_delegated: { dataType: "boolean", required: true },
      job_delegation_count: { dataType: "double", required: true },
      delegations: { dataType: "array", array: { dataType: "refObject", ref: "IDelegation" }, required: true },
      is_disabled_elligible: { dataType: "boolean", required: true },
      job_count: { dataType: "double" },
      job_duration: { dataType: "double" },
      job_rythm: { dataType: "string" },
      custom_address: { dataType: "string", required: true },
      custom_geo_coordinates: { dataType: "string", required: true },
      stats_detail_view: { dataType: "double" },
      stats_search_view: { dataType: "double" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  RECRUITER_STATUS: {
    dataType: "refEnum",
    enums: ["Actif", "Archivé", "En attente de validation"],
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IRecruiter: {
    dataType: "refObject",
    properties: {
      _id: { dataType: "string", required: true },
      establishment_id: { dataType: "string", required: true },
      establishment_raison_sociale: { dataType: "string", required: true },
      establishment_enseigne: { dataType: "string", required: true },
      establishment_siret: { dataType: "string", required: true },
      establishment_size: { dataType: "string", required: true },
      establishment_creation_date: { dataType: "string", required: true },
      address_detail: { ref: "IGlobalAddress", required: true },
      address: { dataType: "string", required: true },
      geo_coordinates: { dataType: "string", required: true },
      is_delegated: { dataType: "boolean", required: true },
      cfa_delegated_siret: { dataType: "string", required: true },
      last_name: { dataType: "string", required: true },
      first_name: { dataType: "string", required: true },
      phone: { dataType: "string" },
      email: { dataType: "string", required: true },
      jobs: { dataType: "array", array: { dataType: "refObject", ref: "IJobs" }, required: true },
      origin: { dataType: "string", required: true },
      opco: { dataType: "string", required: true },
      idcc: { dataType: "string" },
      status: { ref: "RECRUITER_STATUS", required: true },
      naf_code: { dataType: "string", required: true },
      naf_label: { dataType: "string", required: true },
      createdAt: { dataType: "datetime", required: true },
      updatedAt: { dataType: "datetime", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  TEstablishmentResponseSuccess: {
    dataType: "refAlias",
    type: { ref: "IRecruiter", validators: {} },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  TCreateEstablishmentBody: {
    dataType: "refAlias",
    type: {
      dataType: "nestedObjectLiteral",
      nestedProperties: {
        origin: { dataType: "string" },
        idcc: { dataType: "string" },
        email: { dataType: "string", required: true },
        phone: { dataType: "string" },
        last_name: { dataType: "string", required: true },
        first_name: { dataType: "string", required: true },
        establishment_siret: { dataType: "string", required: true },
      },
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ICreateJobBody: {
    dataType: "refObject",
    properties: {
      custom_geo_coordinates: { dataType: "string" },
      custom_address: { dataType: "string" },
      job_description: { dataType: "string" },
      job_employer_description: { dataType: "string" },
      job_start_date: { dataType: "string", required: true },
      job_rythm: { dataType: "string" },
      job_count: { dataType: "double" },
      is_disabled_elligible: { dataType: "boolean", required: true },
      job_type: { dataType: "array", array: { dataType: "string" }, required: true },
      job_duration: { dataType: "double", required: true },
      job_level_label: { dataType: "string", required: true },
      appellation_code: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Partial_TJob_: {
    dataType: "refAlias",
    type: {
      dataType: "nestedObjectLiteral",
      nestedProperties: {
        job_level_label: { dataType: "string" },
        job_duration: { dataType: "double" },
        job_type: { dataType: "array", array: { dataType: "string" } },
        is_disabled_elligible: { dataType: "boolean" },
        job_count: { dataType: "double" },
        job_rythm: { dataType: "string" },
        job_start_date: { dataType: "string" },
        job_employer_description: { dataType: "string" },
        job_description: { dataType: "string" },
        custom_address: { dataType: "string" },
        custom_geo_coordinates: { dataType: "string" },
      },
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IGetDelegation: {
    dataType: "refObject",
    properties: {
      _id: { dataType: "string", required: true },
      numero_voie: { dataType: "string", required: true },
      type_voie: { dataType: "string", required: true },
      nom_voie: { dataType: "string", required: true },
      code_postal: { dataType: "string", required: true },
      nom_departement: { dataType: "string", required: true },
      entreprise_raison_sociale: { dataType: "string", required: true },
      geo_coordonnees: { dataType: "string", required: true },
      distance_en_km: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ICreateDelegation: {
    dataType: "refObject",
    properties: {
      establishmentIds: { dataType: "array", array: { dataType: "string" }, required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IApiError: {
    dataType: "refObject",
    properties: {
      result: { dataType: "string" },
      error: { dataType: "string" },
      message: { dataType: "any" },
      status: { dataType: "double" },
      statusText: { dataType: "string" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ILbaItemContact: {
    dataType: "refObject",
    properties: {
      email: { dataType: "string" },
      name: { dataType: "string" },
      phone: { dataType: "string" },
      info: { dataType: "string" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ILbaItemPlace: {
    dataType: "refObject",
    properties: {
      distance: { dataType: "double", required: true },
      fullAddress: { dataType: "string", required: true },
      latitude: { dataType: "string", required: true },
      longitude: { dataType: "string", required: true },
      city: { dataType: "string", required: true },
      address: { dataType: "string", required: true },
      cedex: { dataType: "string", required: true },
      zipCode: { dataType: "string", required: true },
      insee: { dataType: "string", required: true },
      departementNumber: { dataType: "string", required: true },
      region: { dataType: "string", required: true },
      remoteOnly: { dataType: "boolean", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Partial_ILbaItemPlace_: {
    dataType: "refAlias",
    type: {
      dataType: "nestedObjectLiteral",
      nestedProperties: {
        distance: { dataType: "double" },
        fullAddress: { dataType: "string" },
        latitude: { dataType: "string" },
        longitude: { dataType: "string" },
        city: { dataType: "string" },
        address: { dataType: "string" },
        cedex: { dataType: "string" },
        zipCode: { dataType: "string" },
        insee: { dataType: "string" },
        departementNumber: { dataType: "string" },
        region: { dataType: "string" },
        remoteOnly: { dataType: "boolean" },
      },
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ILbaItemCompanyHQ: {
    dataType: "refObject",
    properties: {
      siret: { dataType: "string", required: true },
      id: { dataType: "string", required: true },
      uai: { dataType: "string", required: true },
      type: { dataType: "string", required: true },
      hasConvention: { dataType: "string", required: true },
      place: { ref: "Partial_ILbaItemPlace_", required: true },
      name: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ILbaItemOpco: {
    dataType: "refObject",
    properties: {
      label: { dataType: "string", required: true },
      url: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ILbaItemCompany: {
    dataType: "refObject",
    properties: {
      name: { dataType: "string", required: true },
      siret: { dataType: "string", required: true },
      size: { dataType: "string" },
      logo: { dataType: "string" },
      description: { dataType: "string" },
      socialNetwork: { dataType: "string" },
      url: { dataType: "string" },
      id: { dataType: "string", required: true },
      uai: { dataType: "string", required: true },
      place: { ref: "Partial_ILbaItemPlace_", required: true },
      mandataire: { dataType: "boolean" },
      creationDate: { dataType: "datetime" },
      headquarter: { ref: "ILbaItemCompanyHQ", required: true },
      opco: { ref: "ILbaItemOpco" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ILbaItemJob: {
    dataType: "refObject",
    properties: {
      description: { dataType: "string", required: true },
      creationDate: { dataType: "union", subSchemas: [{ dataType: "string" }, { dataType: "datetime" }], required: true },
      id: { dataType: "string", required: true },
      contractType: { dataType: "string", required: true },
      contractDescription: { dataType: "string" },
      duration: { dataType: "string" },
      jobStartDate: { dataType: "union", subSchemas: [{ dataType: "string" }, { dataType: "datetime" }], required: true },
      romeDetails: { dataType: "object", required: true },
      rythmeAlternance: { dataType: "string", required: true },
      elligibleHandicap: { dataType: "boolean" },
      dureeContrat: { dataType: "string", required: true },
      quantiteContrat: { dataType: "double" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ILbaItemRome: {
    dataType: "refObject",
    properties: {
      code: { dataType: "string", required: true },
      label: { dataType: "string" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ILbaItemNaf: {
    dataType: "refObject",
    properties: {
      code: { dataType: "string" },
      label: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ILbaItemTrainingSession: {
    dataType: "refObject",
    properties: {
      startTime: { dataType: "string", required: true },
      endTime: { dataType: "string", required: true },
      isPermanentEntry: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ILbaItemTraining: {
    dataType: "refObject",
    properties: {
      description: { dataType: "string", required: true },
      objectif: { dataType: "string", required: true },
      sessions: { dataType: "array", array: { dataType: "refObject", ref: "ILbaItemTrainingSession" }, required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ILbaItem: {
    dataType: "refObject",
    properties: {
      ideaType: { dataType: "string", required: true },
      title: { dataType: "string", required: true },
      longTitle: { dataType: "string", required: true },
      id: { dataType: "string", required: true },
      idRco: { dataType: "string", required: true },
      idRcoFormation: { dataType: "string", required: true },
      contact: { ref: "ILbaItemContact", required: true },
      place: { ref: "ILbaItemPlace", required: true },
      company: { ref: "ILbaItemCompany", required: true },
      createdAt: { dataType: "string", required: true },
      lastUpdateAt: { dataType: "string", required: true },
      url: { dataType: "string", required: true },
      cleMinistereEducatif: { dataType: "string", required: true },
      diplomaLevel: { dataType: "string", required: true },
      diploma: { dataType: "string", required: true },
      cfd: { dataType: "string", required: true },
      rncpCode: { dataType: "string", required: true },
      rncpLabel: { dataType: "string", required: true },
      rncpEligibleApprentissage: { dataType: "string", required: true },
      period: { dataType: "string", required: true },
      capacity: { dataType: "string", required: true },
      onisepUrl: { dataType: "string", required: true },
      job: { ref: "ILbaItemJob", required: true },
      romes: { dataType: "array", array: { dataType: "refObject", ref: "ILbaItemRome" }, required: true },
      nafs: { dataType: "array", array: { dataType: "refObject", ref: "ILbaItemNaf" }, required: true },
      training: { ref: "ILbaItemTraining", required: true },
      applicationCount: { dataType: "double", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IMetiers: {
    dataType: "refObject",
    properties: {
      metiers: { dataType: "array", array: { dataType: "string" } },
      error: { dataType: "string" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  TGetMetiersResponseSuccess: {
    dataType: "refAlias",
    type: { ref: "IMetiers", validators: {} },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IRomeWithLabel: {
    dataType: "refObject",
    properties: {
      codeRome: { dataType: "string", required: true },
      intitule: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IMetierEnrichi: {
    dataType: "refObject",
    properties: {
      label: { dataType: "string", required: true },
      romes: { dataType: "array", array: { dataType: "string" }, required: true },
      rncps: { dataType: "array", array: { dataType: "string" } },
      type: { dataType: "string" },
      romeTitles: { dataType: "array", array: { dataType: "refObject", ref: "IRomeWithLabel" } },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IMetiersEnrichis: {
    dataType: "refObject",
    properties: {
      labelsAndRomes: { dataType: "array", array: { dataType: "refObject", ref: "IMetierEnrichi" } },
      labelsAndRomesForDiplomas: { dataType: "array", array: { dataType: "refObject", ref: "IMetierEnrichi" } },
      error: { dataType: "string" },
      error_messages: { dataType: "array", array: { dataType: "string" } },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  TGetMetiersEnrichisResponseSuccess: {
    dataType: "refAlias",
    type: { ref: "IMetiersEnrichis", validators: {} },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IAppellationRome: {
    dataType: "refObject",
    properties: {
      codeRome: { dataType: "string", required: true },
      intitule: { dataType: "string", required: true },
      appellation: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IAppellationsRomes: {
    dataType: "refObject",
    properties: {
      coupleAppellationRomeMetier: { dataType: "array", array: { dataType: "refObject", ref: "IAppellationRome" } },
      error: { dataType: "string" },
      error_messages: { dataType: "array", array: { dataType: "string" } },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  TGetAppellationsRomesResponseSuccess: {
    dataType: "refAlias",
    type: { ref: "IAppellationsRomes", validators: {} },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  IMetierDavenir: {
    dataType: "refObject",
    properties: {
      codeROME: { dataType: "string", required: true },
      title: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ISuggestionMetiersDavenir: {
    dataType: "refObject",
    properties: {
      suggestionsMetiersDavenir: { dataType: "array", array: { dataType: "refObject", ref: "IMetierDavenir" } },
      error: { dataType: "string" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  TGetMetiersDAvenirResponseSuccess: {
    dataType: "refAlias",
    type: { ref: "ISuggestionMetiersDavenir", validators: {} },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}
const validationService = new ValidationService(models)

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: Router) {
  // ###########################################################################################################
  //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
  //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
  // ###########################################################################################################
  app.post(
    "/api/appointment-request/context/create",
    ...fetchMiddlewares<RequestHandler>(AppointmentsController),
    ...fetchMiddlewares<RequestHandler>(AppointmentsController.prototype.createContext),

    function AppointmentsController_createContext(request: any, response: any, next: any) {
      const args = {
        body: { in: "body", name: "body", required: true, ref: "TCreateContextBody" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new AppointmentsController()

        const promise = controller.createContext.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, undefined, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/jobs/establishment",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.getEstablishment),

    function JobsController_getEstablishment(request: any, response: any, next: any) {
      const args = {
        establishment_siret: { in: "query", name: "establishment_siret", required: true, dataType: "string" },
        email: { in: "query", name: "email", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.getEstablishment.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/jobs/bulk",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.getJobs),

    function JobsController_getJobs(request: any, response: any, next: any) {
      const args = {
        request: { in: "request", name: "request", required: true, dataType: "object" },
        query: { default: "{}", in: "query", name: "query", dataType: "string" },
        select: { default: "{}", in: "query", name: "select", dataType: "string" },
        page: { default: 1, in: "query", name: "page", dataType: "double" },
        limit: { default: 10, in: "query", name: "limit", dataType: "double" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.getJobs.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.post(
    "/api/v1/jobs/establishment",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.createEstablishment),

    function JobsController_createEstablishment(request: any, response: any, next: any) {
      const args = {
        request: { in: "request", name: "request", required: true, dataType: "object" },
        body: { in: "body", name: "body", required: true, ref: "TCreateEstablishmentBody" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.createEstablishment.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 201, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.post(
    "/api/v1/jobs/:establishmentId",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.createJob),

    function JobsController_createJob(request: any, response: any, next: any) {
      const args = {
        body: { in: "body", name: "body", required: true, ref: "ICreateJobBody" },
        establishmentId: { in: "path", name: "establishmentId", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.createJob.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 201, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.patch(
    "/api/v1/jobs/:jobId",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.updateJob),

    function JobsController_updateJob(request: any, response: any, next: any) {
      const args = {
        body: { in: "body", name: "body", required: true, ref: "Partial_TJob_" },
        jobId: { in: "path", name: "jobId", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.updateJob.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/jobs/delegations/:jobId",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.getDelegation),

    function JobsController_getDelegation(request: any, response: any, next: any) {
      const args = {
        jobId: { in: "path", name: "jobId", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.getDelegation.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.post(
    "/api/v1/jobs/delegations/:jobId",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.createDelegation),

    function JobsController_createDelegation(request: any, response: any, next: any) {
      const args = {
        body: { in: "body", name: "body", required: true, ref: "ICreateDelegation" },
        jobId: { in: "path", name: "jobId", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.createDelegation.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.post(
    "/api/v1/jobs/provided/:jobId",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.setJobAsProvided),

    function JobsController_setJobAsProvided(request: any, response: any, next: any) {
      const args = {
        jobId: { in: "path", name: "jobId", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.setJobAsProvided.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 204, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.post(
    "/api/v1/jobs/canceled/:jobId",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.setJobAsCanceled),

    function JobsController_setJobAsCanceled(request: any, response: any, next: any) {
      const args = {
        jobId: { in: "path", name: "jobId", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.setJobAsCanceled.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 204, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.post(
    "/api/v1/jobs/extend/:jobId",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.extendJobExpiration),

    function JobsController_extendJobExpiration(request: any, response: any, next: any) {
      const args = {
        jobId: { in: "path", name: "jobId", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.extendJobExpiration.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 204, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/jobs",
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.getJobOpportunities),

    function JobsController_getJobOpportunities(request: any, response: any, next: any) {
      const args = {
        request: { in: "request", name: "request", required: true, dataType: "object" },
        romes: { in: "query", name: "romes", dataType: "array", array: { dataType: "string" } },
        rncp: { in: "query", name: "rncp", dataType: "string" },
        referer: { in: "header", name: "referer", dataType: "string" },
        caller: { in: "query", name: "caller", dataType: "string" },
        latitude: { in: "query", name: "latitude", dataType: "string" },
        longitude: { in: "query", name: "longitude", dataType: "string" },
        radius: { in: "query", name: "radius", dataType: "double" },
        insee: { in: "query", name: "insee", dataType: "string" },
        sources: { in: "query", name: "sources", dataType: "string" },
        diploma: { in: "query", name: "diploma", dataType: "string" },
        opco: { in: "query", name: "opco", dataType: "string" },
        opcoUrl: { in: "query", name: "opcoUrl", dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.getJobOpportunities.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/jobs/company/:siret",
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.getCompany),

    function JobsController_getCompany(request: any, response: any, next: any) {
      const args = {
        siret: { in: "path", name: "siret", required: true, dataType: "string" },
        referer: { in: "header", name: "referer", dataType: "string" },
        caller: { in: "query", name: "caller", dataType: "string" },
        type: { in: "query", name: "type", dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.getCompany.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/jobs/matcha/:id",
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.getLbaJob),

    function JobsController_getLbaJob(request: any, response: any, next: any) {
      const args = {
        id: { in: "path", name: "id", required: true, dataType: "string" },
        caller: { in: "query", name: "caller", dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.getLbaJob.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.post(
    "/api/v1/jobs/matcha/:id/stats/view-details",
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.statsViewLbaJob),

    function JobsController_statsViewLbaJob(request: any, response: any, next: any) {
      const args = {
        id: { in: "path", name: "id", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.statsViewLbaJob.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/jobs/job/:id",
    ...fetchMiddlewares<RequestHandler>(JobsController),
    ...fetchMiddlewares<RequestHandler>(JobsController.prototype.getPeJob),

    function JobsController_getPeJob(request: any, response: any, next: any) {
      const args = {
        id: { in: "path", name: "id", required: true, dataType: "string" },
        caller: { in: "query", name: "caller", dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new JobsController()

        const promise = controller.getPeJob.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/metiers/metiersParFormation/:cfd",
    ...fetchMiddlewares<RequestHandler>(MetiersController),
    ...fetchMiddlewares<RequestHandler>(MetiersController.prototype.getMetiersParCFD),

    function MetiersController_getMetiersParCFD(request: any, response: any, next: any) {
      const args = {
        cfd: { in: "path", name: "cfd", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new MetiersController()

        const promise = controller.getMetiersParCFD.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/metiers/metiersParEtablissement/:siret",
    ...fetchMiddlewares<RequestHandler>(MetiersController),
    ...fetchMiddlewares<RequestHandler>(MetiersController.prototype.getMetiersParEtablissement),

    function MetiersController_getMetiersParEtablissement(request: any, response: any, next: any) {
      const args = {
        siret: { in: "path", name: "siret", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new MetiersController()

        const promise = controller.getMetiersParEtablissement.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/metiers/all",
    ...fetchMiddlewares<RequestHandler>(MetiersController),
    ...fetchMiddlewares<RequestHandler>(MetiersController.prototype.getTousLesMetiers),

    function MetiersController_getTousLesMetiers(request: any, response: any, next: any) {
      const args = {}

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new MetiersController()

        const promise = controller.getTousLesMetiers.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/metiers",
    ...fetchMiddlewares<RequestHandler>(MetiersController),
    ...fetchMiddlewares<RequestHandler>(MetiersController.prototype.getMetiers),

    function MetiersController_getMetiers(request: any, response: any, next: any) {
      const args = {
        title: { in: "query", name: "title", required: true, dataType: "string" },
        romes: { in: "query", name: "romes", dataType: "string" },
        rncps: { in: "query", name: "rncps", dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new MetiersController()

        const promise = controller.getMetiers.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/v1/metiers/intitule",
    ...fetchMiddlewares<RequestHandler>(MetiersController),
    ...fetchMiddlewares<RequestHandler>(MetiersController.prototype.getCoupleAppelationRomeIntitule),

    function MetiersController_getCoupleAppelationRomeIntitule(request: any, response: any, next: any) {
      const args = {
        label: { in: "query", name: "label", required: true, dataType: "string" },
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new MetiersController()

        const promise = controller.getCoupleAppelationRomeIntitule.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 200, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/api/metiersdavenir",
    ...fetchMiddlewares<RequestHandler>(MetiersDAvenirController),
    ...fetchMiddlewares<RequestHandler>(MetiersDAvenirController.prototype.getMetiersDAvenir),

    function MetiersDAvenirController_getMetiersDAvenir(request: any, response: any, next: any) {
      const args = {}

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = []
      try {
        validatedArgs = getValidatedArgs(args, request, response)

        const controller = new MetiersDAvenirController()

        const promise = controller.getMetiersDAvenir.apply(controller, validatedArgs as any)
        promiseHandler(controller, promise, response, 201, next)
      } catch (err) {
        return next(err)
      }
    }
  )
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
    return async function runAuthenticationMiddleware(request: any, _response: any, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      // keep track of failed auth attempts so we can hand back the most
      // recent one.  This behavior was previously existing so preserving it
      // here
      const failedAttempts: any[] = []
      const pushAndRethrow = (error: any) => {
        failedAttempts.push(error)
        throw error
      }

      const secMethodOrPromises: Promise<any>[] = []
      for (const secMethod of security) {
        if (Object.keys(secMethod).length > 1) {
          const secMethodAndPromises: Promise<any>[] = []

          for (const name in secMethod) {
            secMethodAndPromises.push(expressAuthentication(request, name, secMethod[name]).catch(pushAndRethrow))
          }

          // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

          secMethodOrPromises.push(
            Promise.all(secMethodAndPromises).then((users) => {
              return users[0]
            })
          )
        } else {
          for (const name in secMethod) {
            secMethodOrPromises.push(expressAuthentication(request, name, secMethod[name]).catch(pushAndRethrow))
          }
        }
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      try {
        request["user"] = await promiseAny.call(Promise, secMethodOrPromises)
        next()
      } catch (err) {
        // Show most recent error as response
        const error = failedAttempts.pop()
        error.status = error.status || 401
        next(error)
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    }
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function isController(object: any): object is Controller {
    return "getHeaders" in object && "getStatus" in object && "setStatus" in object
  }

  function promiseHandler(controllerObj: any, promise: any, response: any, successStatus: any, next: any) {
    return Promise.resolve(promise)
      .then((data: any) => {
        let statusCode = successStatus
        let headers
        if (isController(controllerObj)) {
          headers = controllerObj.getHeaders()
          statusCode = controllerObj.getStatus() || statusCode
        }

        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

        returnHandler(response, statusCode, data, headers)
      })
      .catch((error: any) => next(error))
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function returnHandler(response: any, statusCode?: number, data?: any, headers: any = {}) {
    if (response.headersSent) {
      return
    }
    Object.keys(headers).forEach((name: string) => {
      response.set(name, headers[name])
    })
    if (data && typeof data.pipe === "function" && data.readable && typeof data._read === "function") {
      response.status(statusCode || 200)
      data.pipe(response)
    } else if (data !== null && data !== undefined) {
      response.status(statusCode || 200).json(data)
    } else {
      response.status(statusCode || 204).end()
    }
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function responder(response: any): TsoaResponse<HttpStatusCodeLiteral, unknown> {
    return function (status, data, headers) {
      returnHandler(response, status, data, headers)
    }
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function getValidatedArgs(args: any, request: any, response: any): any[] {
    const fieldErrors: FieldErrors = {}
    const values = Object.keys(args).map((key) => {
      const name = args[key].name
      switch (args[key].in) {
        case "request":
          return request
        case "query":
          return validationService.ValidateParam(args[key], request.query[name], name, fieldErrors, undefined, { noImplicitAdditionalProperties: "throw-on-extras" })
        case "queries":
          return validationService.ValidateParam(args[key], request.query, name, fieldErrors, undefined, { noImplicitAdditionalProperties: "throw-on-extras" })
        case "path":
          return validationService.ValidateParam(args[key], request.params[name], name, fieldErrors, undefined, { noImplicitAdditionalProperties: "throw-on-extras" })
        case "header":
          return validationService.ValidateParam(args[key], request.header(name), name, fieldErrors, undefined, { noImplicitAdditionalProperties: "throw-on-extras" })
        case "body":
          return validationService.ValidateParam(args[key], request.body, name, fieldErrors, undefined, { noImplicitAdditionalProperties: "throw-on-extras" })
        case "body-prop":
          return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, "body.", { noImplicitAdditionalProperties: "throw-on-extras" })
        case "formData":
          if (args[key].dataType === "file") {
            return validationService.ValidateParam(args[key], request.file, name, fieldErrors, undefined, { noImplicitAdditionalProperties: "throw-on-extras" })
          } else if (args[key].dataType === "array" && args[key].array.dataType === "file") {
            return validationService.ValidateParam(args[key], request.files, name, fieldErrors, undefined, { noImplicitAdditionalProperties: "throw-on-extras" })
          } else {
            return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, undefined, { noImplicitAdditionalProperties: "throw-on-extras" })
          }
        case "res":
          return responder(response)
      }
    })

    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidateError(fieldErrors, "")
    }
    return values
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
