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
    naf_code,
    naf_label,
    street_name,
    street_number,
    zip_code,
    email,
    phone,
    company_size,
    rome_codes,
    partner_job_id,
    coordonneeLambertAbscisseEtablissement,
    coordonneeLambertOrdonneeEtablissement,
    libelleCommuneEtablissement,
  } = recruteursLba

  return {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    partner_job_id: partner_job_id,
    workplace_siret: siret,
    workplace_brand: enseigne,
    workplace_legal_name: raison_sociale,
    workplace_naf_code: naf_code,
    workplace_naf_label: naf_label,
    workplace_address_city: libelleCommuneEtablissement,
    workplace_address_street_label: street_name,
    workplace_address_zipcode: zip_code,
    workplace_address_label: joinNonNullStrings([street_number, street_name, zip_code, libelleCommuneEtablissement]),
    workplace_geopoint: getWorkplaceGeolocation(coordonneeLambertAbscisseEtablissement, coordonneeLambertOrdonneeEtablissement),
    workplace_size: company_size,
    apply_email: email,
    apply_phone: phone,
    offer_rome_codes: rome_codes.map(({ rome_code }) => rome_code),
    // laisser recruteurs_lba pour les entreprises issue de l'algorithme de lba (passer la validation & l'import dans jobs_partners)
    offer_title: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    offer_description: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
  }
}

// Définition des systèmes de coordonnées
const lambert93 = "EPSG:2154"
const wgs84 = "EPSG:4326"

// Définition de Lambert 93 (au cas où proj4 ne l'aurait pas déjà en base)
proj4.defs(lambert93, "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 " + "+x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs")

const getWorkplaceGeolocation = (x, y): IComputedJobsPartners["workplace_geopoint"] => {
  if (x === 0 || y === 0) return null
  // proj4 returns latitude first
  const [latitude, longitude] = proj4(lambert93, wgs84, [x, y])
  return { type: "Point", coordinates: [longitude, latitude] }
}
