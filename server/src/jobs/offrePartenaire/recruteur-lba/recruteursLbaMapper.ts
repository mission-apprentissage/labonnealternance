import { ObjectId } from "bson"
import proj4 from "proj4"
import { joinNonNullStrings } from "shared"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { IRecruteursLbaRaw } from "shared/models/rawRecruteursLba.model"

import { blankComputedJobPartner } from "../fillComputedJobsPartners"

export const recruteursLbaToJobPartners = (recruteursLba: IRecruteursLbaRaw): IComputedJobsPartners => {
  const {
    siret,
    enseigne,
    raison_sociale,
    activitePrincipaleEtablissement,
    labelActivitePrincipaleEtablissement,
    street_name,
    street_number,
    zip_code,
    email,
    phone,
    company_size,
    rome_codes,
    coordonneeLambertAbscisseEtablissement,
    coordonneeLambertOrdonneeEtablissement,
    libelleCommuneEtablissement,
    createdAt,
  } = recruteursLba

  return {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    partner_job_id: siret,
    workplace_siret: siret,
    workplace_brand: enseigne,
    workplace_legal_name: raison_sociale,
    workplace_naf_code: activitePrincipaleEtablissement,
    workplace_naf_label: labelActivitePrincipaleEtablissement,
    workplace_address_city: libelleCommuneEtablissement,
    workplace_address_street_label: street_name,
    workplace_address_zipcode: zip_code,
    workplace_address_label: joinNonNullStrings([street_number, street_name, zip_code, libelleCommuneEtablissement]),
    workplace_geopoint: getWorkplaceGeolocation(coordonneeLambertAbscisseEtablissement, coordonneeLambertOrdonneeEtablissement, zip_code),
    workplace_size: company_size,
    apply_email: email,
    apply_phone: phone,
    offer_rome_codes: rome_codes.map(({ rome_code }) => rome_code),
    // laisser recruteurs_lba pour les entreprises issue de l'algorithme de lba (passer la validation & l'import dans jobs_partners)
    offer_creation: createdAt,
    offer_title: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    offer_description: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
  }
}

// Définition des systèmes de coordonnées
const lambert93 = "EPSG:2154"
const laReunion = "EPSG:2975"
const guyane = "EPSG:2972"
const guadeloupeEtMartinique = "EPSG:5490"

const wgs84 = "EPSG:4326"

// Définition de Lambert 93 (au cas où proj4 ne l'aurait pas déjà en base)
proj4.defs(lambert93, "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 " + "+x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs")
proj4.defs(laReunion, "+proj=utm +zone=40 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
proj4.defs(guyane, "+proj=utm +zone=22 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
proj4.defs(guadeloupeEtMartinique, "+proj=utm +zone=20 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")

const getRegionFromZipCode = (zip_code: string | null): string => {
  if (!zip_code) return lambert93
  const prefix = zip_code.substring(0, 3)
  switch (prefix) {
    case "974":
      return laReunion
    case "971":
    case "972":
    case "977":
    case "978":
      return guadeloupeEtMartinique
    case "973":
      return guyane
    default:
      return lambert93
  }
}

export const getWorkplaceGeolocation = (x: number | null, y: number | null, zipCode: string | null): IComputedJobsPartners["workplace_geopoint"] => {
  if (x === 0 || y === 0 || x === null || y === null) return null

  const [longitude, latitude] = proj4(getRegionFromZipCode(zipCode), wgs84, [x, y])
  return { type: "Point", coordinates: [longitude, latitude] }
}
