import mailController from "company-email-validator";
/**
 * @description Check if an email is included in the provided array
 * @param {object[]} contactList
 * @param {string} userEmail
 * @returns {boolean}
 */
export const checkIfUserMailExistInReferentiel = (contactList, userEmail) =>
  contactList.map((x) => x.email.toLowerCase()).includes(userEmail.toLowerCase());

/**
 * @description get all domains from an array of emails
 * @param {object[]} contactList
 * @returns {string[]}
 */
export const getAllDomainsFromEmailList = (contactList) => {
  const domains = contactList.reduce((acc, contact) => {
    let [, domain] = contact.email.split("@");
    if (!acc.includes(domain)) {
      acc.push(domain);
    }
    return acc;
  }, []);

  return domains;
};

/**
 * @description check if an email is generic or private
 * @param {string} userEmail
 * @returns {boolean}
 */
export const checkIfUserEmailIsPrivate = (userEmail) => mailController.isCompanyEmail(userEmail);
