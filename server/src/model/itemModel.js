const itemModel = (type) => {
  return {
    ideaType: type, // type de l'item :  formation | lbb | lba | peJob | matcha

    title: null, // pe -> intitule | lbb/lba -> name | formation -> nom | matcha -> offres.libelle
    longTitle: null, // formation -> intitule_long,
    id: null, // formation -> id | matcha -> id_form

    contact: null, // informations de contact. optionnel
    /*{
            email     // pe -> contact.courriel | lbb/lba -> email | formation -> email | matcha -> email
            name      // pe -> contact.nom | matcha -> prenom nom
            phone     // lbb/lba --> phone | matcha -> telephone
            info      // pe -> contact.coordonnees1+contact.coordonnees2+contact.coordonnees3
            }
        */

    // lieu principal pour l'item, lieu de formation ou lieu de l'offre ou adresse de l'entreprise
    place: {
      distance: null, // distance au centre de recherche en km. pe --> lieutTravail.distance recalculé par turf.js | formation --> sort[0] | lbb/lba -> distance | matcha -> sort[0]
      fullAddress: null, // adresse postale reconstruite à partir des éléments d'adresse fournis | matcha -> adresse
      latitude: null, // formation -> idea_geo_coordonnees_etablissement | pe -> lieuTravail.latitude | lbb/lba -> lat | matcha -> geo_coordonnees
      longitude: null, // formation -> idea_geo_coordonnees_etablissement | pe -> lieuTravail.longitude | lbb/lba -> lon | matcha -> geo_coordonnees
      city: null, // pe -> lieuTravail.libelle | formation -> localite | pe -> city
      address: null, // formation -> etablissement_formateur_adresse, etablissement_formateur_complement_adresse | lbb / lba -> address | matcha -> adresse
      cedex: null, // formation -> etablissement_formateur_cedex
      zipCode: null, // formation -> etablissement_formateur_code_postal | pe -> lieuTravail.codePostal
      insee: null, // pe -> lieuTravail.commune
      departementNumber: null, // formation -> num_departement
      region: null, // formation -> region
    },

    company: {
      name: null, // pe -> entreprise.nom | formation -> etablissement_formateur_entreprise_raison_sociale | lbb/lba -> name | matcha -> raison_sociale
      siret: null, // lbb/lba -> siret | formation -> etablissement_formateur_siret | matcha -> siret
      size: null, // lbb/lba -> headcount_text
      logo: null, // pe -> entreprise.logo
      description: null, // pe -> entreprise.description
      socialNetwork: null, // lbb / lba -> social_network
      url: null, // lbb / lba -> website
      id: null, // formation -> etablissement_formateur_id
      uai: null, // formation -> etablissement_formateur_uai
      place: null /*{
            city,   // formation -> etablissement_formateur_localite
      }*/,

      headquarter: null /*{    // uniquement pour formation
                id, // formation -> etablissement_gestionnaire_id
                uai,// formation -> etablissement_gestionnaire_uai
                type,// formation -> etablissement_gestionnaire_type
                hasConvention,// formation -> etablissement_gestionnaire_conventionne
                place : {
                    fullAddress,   // reconstruction
                    address,       // formation -> etablissement_gestionnaire_adresse, etablissement_gestionnaire_complement_adresse
                    cedex,         // formation -> etablissement_gestionnaire_cedex
                    zipCode,       // formation -> etablissement_gestionnaire_code_postal
                    city,          // formation -> etablissement_gestionnaire_localite          
                },
                name,              // formation -> etablissement_gestionnaire_entreprise_raison_sociale
            },*/,
    },

    diplomaLevel: null, // formation -> niveau  | matcha -> offres.niveau
    diploma: null, // formation -> diplome
    cfd: null, // formation -> cfd
    rncpCode: null, // formation -> rncp_code
    rncpLabel: null, // formation -> rncp_intitule
    rncpEligibleApprentissage: null, // formation -> rncp_eligible_apprentissage
    period: null, // formation -> periode
    capacity: null, // formation -> capacite
    createdAt: null, // formation -> created_at | matcha -> createdAt
    lastUpdateAt: null, // formation -> last_update_at | matcha -> updatedAt
    onisepUrl: null, // formation -> onisep_url
    url: null, // pe -> reconstruction depuis id | lbb/lba url

    job: null /*                    // uniquement pour pe et matcha
        {
            description,           // pe -> description | matcha -> description
            creationDate,          // pe -> dateCreation | matcha -> createdAt
            id,                    // pe -> id
            contractType,          // pe -> typeContrat
            contractDescription,   // pe -> typeContratLibelle
            duration,              // pe -> dureeTravailLibelle
        },*/,

    romes: null /*[
            {
                code,              // pe -> romeCode | lbb/lba -> matched_rome_code | matcha -> offres.romes
                label,             // pe -> appellationLibelle | lbb/lba -> matched_rome_label
            }
        ],*/,

    nafs: null /* [
            {
                code,               // lbb/lba -> naf
                label,              // lbb/lba -> naf_text
            }
        ],*/,
    training: null /* alimentation côté client à l'ouverture d'une formation
        {
            description,
            objectif,
            duree-indicative,
            modalites-alternance,
            madalites-enseignement,
            niveau-retour-embauche,
        }
    */,
  };
};

module.exports = { itemModel };
