import { promisify } from "util"

import ejs, { Data } from "ejs"
import mjml from "mjml"
import nodemailer, { Transporter } from "nodemailer"
import { Address } from "nodemailer/lib/mailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"
import nodemailerHtmlToText from "nodemailer-html-to-text"

import config from "../config"

const htmlToText = nodemailerHtmlToText.htmlToText
const renderFile: (path: string, data: Data) => Promise<string> = promisify(ejs.renderFile)

type EmailData = Record<string | symbol, any>

type UnpackArray<T> = T extends (infer U)[] ? U : T

type ObjectDeepMap<Obj, MappedValue> = Obj extends Array<any>
  ? ObjectDeepMap<UnpackArray<Obj>, MappedValue>
  : Obj extends object
    ? {
        [P in keyof Obj]?: ObjectDeepMap<Obj[P], MappedValue>
      }
    : MappedValue

type DisableSanitizer<Data extends object> = ObjectDeepMap<Data, true>

const sanitizeForEmail = (text: string) => {
  text = text.replaceAll(/(<([^>]+)>)/gi, "")
  text = text.replaceAll(/\./g, "\u200B.\u200B")
  text = encodeURIComponent(text)
  return text
}

const sanitizeObject = <Data extends EmailData>(obj: Data, disableSanitize?: DisableSanitizer<Data>) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (!value) {
        return [key, value]
      }
      const sanitizeOption = disableSanitize?.[key]
      if (typeof value === "object") {
        value = sanitizeObject(value, sanitizeOption)
      } else if (Array.isArray(value)) {
        value = value.map((subValue) => sanitizeObject(subValue, sanitizeOption))
      } else if (typeof value === "string") {
        const shouldSanitize = sanitizeOption === true
        value = shouldSanitize ? sanitizeForEmail(value) : value
      }
      return [key, value]
    })
  )
}

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
    const buffer = await renderFile(template, { data })
    const { html } = mjml(buffer.toString(), { minify: true })

    return html
  }

  return {
    /**
     * Process template ejs and mjml template.
     */
    renderEmail,
    sendEmail: async <Data extends EmailData>({
      to,
      subject,
      template,
      data,
      disableSanitize,
      from = { name: config.transactionalEmailSender, address: config.transactionalEmail },
      cc = undefined,
      attachments,
    }: {
      to: string
      subject: string
      template: string
      data: Data
      disableSanitize?: DisableSanitizer<Data>
      from?: string | Address
      cc?: string
      attachments?: object[]
    }): Promise<{ messageId: string; accepted?: string[] }> => {
      const sanitizedData = sanitizeObject(data, disableSanitize)
      return transporter.sendMail({
        from,
        to,
        cc,
        subject,
        html: await renderEmail(template, sanitizedData),
        list: {},
        attachments,
      })
    },
  }
}

const mailer = createMailer()

export default mailer
