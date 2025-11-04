import { promisify } from "util"

import type { Data } from "ejs";
import ejs from "ejs"
import mjml from "mjml"
import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer"
import type { Address } from "nodemailer/lib/mailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"
import nodemailerHtmlToText from "nodemailer-html-to-text"

import config from "@/config"
import { startSentryPerfRecording } from "@/common/utils/sentryUtils"


const htmlToText = nodemailerHtmlToText.htmlToText
const renderFile: (path: string, data: Data) => Promise<string> = promisify(ejs.renderFile)

const createTransporter = (): Transporter => {
  const needAuthentication = config.env === "production" || config.env === "pentest"

  const options: SMTPTransport.Options = {
    host: config.smtp.host,
    port: config.smtp.port,
  }

  if (needAuthentication) {
    options.auth = config.smtp.auth
  }

  const transporter = nodemailer.createTransport(options)

  transporter.use("compile", htmlToText())

  return transporter
}

const createMailer = () => {
  const transporter = createTransporter()
  const renderEmail = async (template: string, data: Data = {}): Promise<string> => {
    let html
    await startSentryPerfRecording({ name: "mailer", operation: "renderEmail" }, async () => {
      const buffer = await renderFile(template, { data })
      const converted = mjml(buffer.toString(), { minify: true })
      html = converted.html
    })
    return html
  }

  return {
    /**
     * Process template ejs and mjml template.
     */
    renderEmail,
    sendEmail: async ({
      to,
      subject,
      template,
      data,
      from = { name: config.transactionalEmailSender, address: config.transactionalEmail },
      cc = undefined,
      attachments,
    }: {
      to: string
      subject: string
      template: string
      data: object
      from?: string | Address
      cc?: string
      attachments?: object[]
    }): Promise<{ messageId: string; accepted?: string[] }> => {
      const html = await renderEmail(template, data)
      let mail
      await startSentryPerfRecording({ name: "mailer", operation: "sendEmail" }, () => {
        mail = transporter.sendMail({
          from,
          to,
          cc,
          subject,
          html,
          list: {},
          attachments,
        })
      })

      return mail
    },
  }
}

const mailer = createMailer()

export default mailer
