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
    const baseUrl = Cypress.env("smtp")
    const login = Cypress.env("SMTP_LOGIN")
    const password = Cypress.env("SMTP_PASSWORD")
    const Authorization = login && password ? `Basic ${btoa(`${login}:${password}`)}` : undefined
    const headers = Authorization ? { Authorization } : undefined
    return cy
      .request({
        method: "GET",
        url: `${baseUrl}/api/v1/messages?limit=${limit}`,
        headers,
      })
      .then((messagesResponse: Cypress.Response<MessagesResponse>) => {
        const { messages } = messagesResponse.body
        const messageOpt = messages.find((message) => message.To[0].Address === to.toLowerCase() && message.Subject.includes(includedSubject))
        if (!messageOpt) {
          console.error(messages)
          throw new Error(`could not find mail sent to ${to} with subject=${includedSubject}`)
        }
        return cy.request({
          method: "GET",
          url: `${baseUrl}/api/v1/message/${messageOpt.ID}`,
          headers,
        })
      })
      .then((detailResponse: Cypress.Response<MailDetail>) => {
        return detailResponse.body.Text
      })
  },
  findUrlInBrackets(urlLike: string, content: string) {
    const cleanUrl = urlLike.replace(new RegExp("\\*", "g"), ".*").replace("?", "\\?")
    const regexpMatch = new RegExp(`\\[(${cleanUrl})\\]`, "gi").exec(content)
    const urlOpt = regexpMatch[1]
    if (!urlOpt) {
      throw new Error(`could not find url like ${urlLike} in ${content}`)
    }
    return urlOpt
  },
}
