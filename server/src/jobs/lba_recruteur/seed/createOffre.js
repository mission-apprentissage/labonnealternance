/* eslint-disable */
import axios from "axios";
import { omit } from "lodash-es";
import { logger } from "../../../common/logger.js";
import { Formulaire, Offre } from "../../../common/model/index.js";
import config from "../../../config.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAllApplications = async (options) => {
  let { page, allCandidature, limit, query } = { page: 1, allCandidature: [], limit: 1000, ...options };

  let params = { page, limit, query };
  logger.debug(`Requesting LBA with parameters`, params);

  const response = await axios.get(
    `https://labonnealternance${
      config.env === "production" ? "" : "-recette"
    }.apprentissage.beta.gouv.fr/api/application/search`,
    {
      headers: {
        Application: config.lba.application,
        "API-key": config.lba.apiKey,
      },
      params,
    }
  );

  const { data, pagination } = response.data;
  allCandidature = allCandidature.concat(data); // Should be properly exploded, function should be pure

  if (page < pagination.number_of_page) {
    return getAllApplications({ page: page + 1, allCandidature, limit });
  } else {
    return allCandidature;
  }
};

export const createOffreCollection = async (application) => {
  logger.info("Deleting offres collections...");
  await Offre.deleteMany({});

  logger.info("Creating offres collections...");
  let formulaires = await Formulaire.find({}).lean();

  await Promise.all(
    formulaires.map(async (form) => {
      await Promise.all(
        form.offres.map(async (offre) => {
          const filtOffre = omit(offre, ["_id"]);
          const filtForm = omit(form, ["_id", "offres", "mailing", "events", "statut"]);
          filtForm.statutFormulaire = form.statut;
          filtOffre.id_offre = offre._id;

          // if (found.length > 0) {
          //   filtOffre.candidatures = found.length;
          // } else {
          //   filtOffre.candidatures = 0;
          // }
          // const candidatures = await application.getApplication(offre._id);

          // console.log(candidatures);

          // filtOffre.candidatures = offre.candidatures =
          //   candidatures.data.data.length > 0 ? candidatures.data.data.length : undefined;

          // console.log("candidatures", filtOffre.candidatures);

          await Offre.collection.insertOne({ ...filtOffre, ...filtForm });
          // await delay(300);
        })
      );
    })
  );

  let offres = await Offre.countDocuments();

  return { offres };
};
