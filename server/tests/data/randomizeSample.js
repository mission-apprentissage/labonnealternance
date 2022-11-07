// eslint-disable-next-line node/no-missing-import, node/no-unpublished-import
import faker from "faker/locale/fr.js";
import RandExp from "randexp";
import { referrers } from "../../src/common/model/constants/referrers.js";
import { roles } from "../../src/common/roles.js";

// Utils
const isRandomCondition = () => Math.random() < 0.66;
const getRandomIdFormation = () => new RandExp(/^[0-9]{8}$/).gen().toUpperCase();
const getRandomUaiEtablissement = () => new RandExp(/^[0-9]{7}[A-Z]{1}$/).gen().toUpperCase();
const getRandomSiretEtablissement = () => new RandExp(/^[0-9]{14}$/).gen().toUpperCase();

/**
 * Random appointment model
 */
const createRandomAppointment = () => {
  return {
    candidat_id: faker.random.uuid(),
    motivations: faker.lorem.sentence(),
    etablissement_id: getRandomUaiEtablissement(),
    formation_id: getRandomIdFormation(),
    referrer: faker.random.objectElement(referrers).name,
  };
};

/**
 * Random candidat-user model
 */
const createRandomCandidat = () => {
  const randomEmail = faker.internet.email();
  return {
    username: randomEmail,
    password: faker.internet.password(),
    firstname: faker.name.firstName(),
    lastname: faker.name.lastName(),
    phone: faker.phone.phoneNumberFormat(),
    email: randomEmail,
    role: roles.candidat,
  };
};

/**
 * Random widget parameter
 */
const createRandomWidgetParameter = () => {
  return {
    etablissement_siret: getRandomSiretEtablissement(),
    etablissement_raison_sociale: faker.lorem.word().toUpperCase(),
    formation_intitule: faker.lorem.sentence(),
    formation_cfd: getRandomIdFormation(),
    email_rdv: faker.internet.email(),
    referrers: isRandomCondition() ? [referrers.LBA.code, referrers.PARCOURSUP.code] : [referrers.LBA.code],
  };
};

/**
 * Create random list
 * @param {*} generateItem
 */
const createRandomListOf =
  (generateItem) =>
  (nbItems = null) => {
    const randomList = [];
    if (!nbItems) {
      nbItems = Math.floor(Math.random() * Math.floor(100));
    }
    for (let index = 0; index < nbItems; index++) {
      randomList.push(generateItem());
    }
    return randomList;
  };

// Random lists
const createRandomAppointmentsList = createRandomListOf(createRandomAppointment);
const createRandomWidgetParametersList = createRandomListOf(createRandomWidgetParameter);
const createRandomCandidatsList = createRandomListOf(createRandomCandidat);

export { createRandomWidgetParametersList, createRandomAppointmentsList, createRandomCandidatsList };
