type MailSummary = {
  ID: string
  To: {
    Name: string
    Address: string
  }[]
  Subject: string
}

type MessagesResponse = {
  messages: MailSummary[]
}

type MailDetail = MailSummary & { Text: string }

export const smtpClient = {
  getMail(to: string, includedSubject: string, limit = 20) {
    return cy
      .request("GET", `${Cypress.env("smtp")}/api/v1/messages?limit=${limit}`)
      .then((messagesResponse: Cypress.Response<MessagesResponse>) => {
        const messageOpt = messagesResponse.body.messages.find((message) => message.To[0].Address === to.toLowerCase() && message.Subject.includes(includedSubject))
        if (!messageOpt) {
          throw new Error(`could not find mail sent to ${to} with subject=${includedSubject}`)
        }
        return cy.request("GET", `${Cypress.env("smtp")}/api/v1/message/${messageOpt.ID}`)
      })
      .then((detailResponse: Cypress.Response<MailDetail>) => {
        return detailResponse.body.Text
      })
  },
  findUrlInBrackets(urlLike: string, content: string) {
    const cleanUrl = urlLike.replace(new RegExp("\\*", "g"), ".*").replace("?", "\\?")
    const urlOpt = new RegExp(`\\[(${cleanUrl})\\]`, "gi").exec(content)?.at(1)
    if (!urlOpt) {
      throw new Error(`could not find url like ${urlLike} in ${content}`)
    }
    return urlOpt
  },
}
