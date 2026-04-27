import nock from "nock"

export const mockApiBal = {
  validationEmail(isValid = true) {
    return nock("https://bal.apprentissage.beta.gouv.fr").persist().post(new RegExp("/organisation/validation", "g")).reply(200, { is_valid: isValid })
  },
}
