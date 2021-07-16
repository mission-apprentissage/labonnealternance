const config = require("config");
const axios = require("axios");
const { itemModel } = require("../../model/itemModel");
const { getAccessToken, peApiHeaders } = require("./common.js");
const { isOriginLocal } = require("../../common/utils/isOriginLocal");
const { manageApiError } = require("../../common/utils/errorManager");

const allowedSources = config.private.allowedSources;

const isAllowedSource = ({ referer, caller }) => {
  return isOriginLocal(referer) || allowedSources.split("|").indexOf(caller) >= 0;
};

const getSomeLbbCompanies = async ({
  romes,
  latitude,
  longitude,
  radius,
  type,
  strictRadius,
  referer,
  caller,
  api = "jobV1",
}) => {
  let companySet = null;
  let currentRadius = strictRadius ? radius : 20000;
  let companyLimit = 100; //TODO: query params options or default value from properties -> size || 100

  let trys = 0;

  while (trys < 3) {
    companySet = await getLbbCompanies({
      romes,
      latitude,
      longitude,
      radius: currentRadius,
      companyLimit,
      type,
      caller,
      api,
    });

    if (companySet.status === 429) {
      console.log("Lbb api quota exceeded. Retrying : ", trys + 1);
      // trois essais pour gérer les 429 quotas exceeded des apis PE.
      trys++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else break;
  }

  //console.log("companies :", companySet);
  if (companySet.companies && companySet.companies.length) {
    companySet = transformLbbCompaniesForIdea({ companySet, radius, type, strictRadius, referer, caller });
    //console.log("apres refine : ", jobs.resultats[0].lieuTravail.distance);
  }

  return companySet;
};

const transformLbbCompaniesForIdea = ({ companySet, type, referer, caller }) => {
  let resultCompanies = {
    results: [],
  };

  if (companySet.companies && companySet.companies.length) {
    const contactAllowedOrigin = isAllowedSource({ referer, caller });

    for (let i = 0; i < companySet.companies.length; ++i) {
      let company = transformLbbCompanyForIdea({ company: companySet.companies[i], type, contactAllowedOrigin });

      resultCompanies.results.push(company);
    }
  }

  return resultCompanies;
};

// Adaptation au modèle Idea et conservation des seules infos utilisées des offres
const transformLbbCompanyForIdea = ({ company, type, contactAllowedOrigin }) => {
  let resultCompany = itemModel(type);

  resultCompany.title = company.name;

  if (contactAllowedOrigin) {
    resultCompany.contact = {
      email: company.email,
      phone: company.phone,
    };
  }

  // format différent selon accès aux bonnes boîtes par recherche ou par siret
  const address = company?.address?.city
    ? `${company.address.street_number} ${company.address.street_name}, ${company.address.zipcode} ${company.address.city}`.trim()
    : company.address;

  resultCompany.place = {
    distance: company.distance ?? 0,
    fullAddress: address,
    latitude: company.lat,
    longitude: company.lon,
    city: company.city,
    address,
  };

  resultCompany.company = {
    name: company.name,
    siret: company.siret,
    size: company.headcount_text,
    socialNetwork: company.social_network,
    url: company.website,
  };

  resultCompany.url = company.url;

  resultCompany.romes = [
    {
      code: company.matched_rome_code,
      label: company.matched_rome_label,
    },
  ];

  resultCompany.nafs = [
    {
      code: company.naf,
      label: company.naf_text,
    },
  ];

  return resultCompany;
};

const lbbApiEndpoint = "https://api.emploi-store.fr/partenaire/labonneboite/v1/company/";
const lbaApiEndpoint = "https://api.emploi-store.fr/partenaire/labonnealternance/v1/company/";
const lbbCompanyApiEndPoint = "https://api.emploi-store.fr/partenaire/labonneboite/v1/office/";

const getLbbCompanies = async ({ romes, latitude, longitude, radius, companyLimit, type, caller, api = "jobV1" }) => {
  try {
    const token = await getAccessToken(type);
    //console.log(token);
    let headers = peApiHeaders;
    headers.Authorization = `Bearer ${token}`;

    const distance = radius || 10;

    let params = {
      rome_codes: romes,
      latitude: latitude,
      sort: "distance", //sort: "score", TODO: remettre sort score après expérimentation CBS
      longitude: longitude,
      contract: type === "lbb" ? "dpae" : "alternance",
      page_size: companyLimit,
      distance,
    };

    const companies = await axios.get(`${type === "lbb" ? lbbApiEndpoint : lbaApiEndpoint}`, {
      params,
      headers,
    });

    //throw new Error(`boom ${type}`);

    return companies.data;
  } catch (error) {
    return manageApiError({ error, api, caller, errorTitle: `getting companies from PE (${api})` });
  }
};

const getCompanyFromSiret = async ({ siret, referer, caller, type }) => {
  try {
    const token = await getAccessToken("lbb");
    let headers = peApiHeaders;
    headers.Authorization = `Bearer ${token}`;

    let companyQuery = null;

    try {
      companyQuery = await axios.get(`${lbbCompanyApiEndPoint}${siret}/details?contract=alternance`, {
        headers,
      });
    } catch (err) {
      if (err?.response?.status === 404) {
        companyQuery = await axios.get(`${lbbCompanyApiEndPoint}${siret}/details`, {
          headers,
        });
      } else {
        throw err;
      }
    }

    let company = transformLbbCompanyForIdea({
      company: companyQuery.data,
      type,
      contactAllowedOrigin: isAllowedSource({ referer, caller }),
    });

    return type === "lbb" ? { lbbCompanies: [company] } : { lbaCompanies: [company] };
  } catch (error) {
    if (error?.response?.status === 404) {
      return { result: "not_found", message: "Société non trouvée" };
    } else {
      return manageApiError({ error, api: "jobV1/company", caller, errorTitle: "getting company by Siret from PE" });
    }
  }
};

module.exports = { getSomeLbbCompanies, getCompanyFromSiret };
