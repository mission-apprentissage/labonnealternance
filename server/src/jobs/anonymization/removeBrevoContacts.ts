import { Readable, Transform, Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import brevo, { GetContactDetails } from "@getbrevo/brevo"

import { logger } from "@/common/logger"
import { sleep } from "@/common/utils/asyncUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { groupStreamData } from "@/common/utils/streamUtils"
import config from "@/config"

const createBrevoContactStream = () => {
  const brevoClient = new brevo.ContactsApi()
  brevoClient.setApiKey(brevo.ContactsApiApiKeys.apiKey, config.smtp.brevoMarketingApiKey)

  return Readable.from(
    (async function* () {
      let offset = 0
      const limit = 1000
      let totalFetched = 0

      while (true) {
        const response = await brevoClient.getContacts(limit, offset)
        const contacts = response.body.contacts ?? []

        if (contacts.length === 0) break

        totalFetched += contacts.length
        logger.info(`Fetched ${totalFetched} contacts from Brevo out of ${response.body.count}`)
        yield contacts

        if (contacts.length < limit) break
        offset += limit
      }
    })()
  )
}

const deleteContactsFromBrevo = async (contactIds: string[]): Promise<void> => {
  const brevoClient = new brevo.ContactsApi()
  brevoClient.setApiKey(brevo.ContactsApiApiKeys.apiKey, config.smtp.brevoMarketingApiKey)

  for (const id of contactIds) {
    try {
      await brevoClient.deleteContact(id)
      logger.info(`Deleted contact ${id}`)
      await sleep(200)
    } catch (error) {
      logger.warn(`Failed to delete contact ${id}: ${error}`)
      await sleep(200)
    }
  }
}

export const removeBrevoContacts = async (): Promise<void> => {
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  let totalToAnonymize = 0
  const brevoClient = new brevo.ContactsApi()
  brevoClient.setApiKey(brevo.ContactsApiApiKeys.apiKey, config.smtp.brevoMarketingApiKey)

  const contactStream = createBrevoContactStream()

  await pipeline(
    contactStream, // batches of 1000
    new Transform({
      objectMode: true,
      transform(contactsBatch: GetContactDetails[], _, callback) {
        const toAnonymize = contactsBatch.filter((contact) => new Date(contact.modifiedAt) < twoYearsAgo)
        for (const contact of toAnonymize) {
          this.push(contact)
        }
        callback()
      },
    }),
    groupStreamData<GetContactDetails>({ size: 50_000 }),
    new Writable({
      objectMode: true,
      async write(contactsGroup: GetContactDetails[], _, callback) {
        try {
          const ids = contactsGroup.map((c) => c.id.toString())
          await deleteContactsFromBrevo(ids)
          totalToAnonymize += ids.length
          callback()
        } catch (err) {
          callback(err as Error)
        }
      },
    })
  )

  logger.info(`${totalToAnonymize} Brevo contacts deleted`)
  await notifyToSlack({
    subject: "Suppression des contacts Brevo après 2 ans d'inactivité",
    message: `Suppression de ${totalToAnonymize} contacts Brevo`,
  })
}
