import axios, { AxiosInstance } from "axios"
import dayjs from "dayjs"
import https from "https"
import { Request } from "express"
import { createHash } from "crypto"

// documentation : https://developer.matomo.org/api-reference/tracking-api

export type MatomoPayload = {
  idsite: number // The ID of the website we're tracking a visit/action for.
  rec: 1 // Required for tracking, must be set to one, eg, &rec=1.

  action_name?: string // The title of the action being tracked. For page tracks this is used as page title. If enabled in your installation you may use the category tree structure in this field. For example, “game / register new user” would then create a group “game” and add the item “register new user” in it.
  url?: string // The full URL for the current action.
  _id?: string // — The unique visitor ID, must be a 16 characters hexadecimal string. Every unique visitor must be assigned a different ID and this ID must not change after it is assigned. If this value is not set Matomo (formerly Piwik) will still track visits, but the unique visitors metric might be less accurate.
  rand?: string // — Meant to hold a random value that is generated before each request. Using it helps avoid the tracking request being cached by the browser or a proxy.
  apiv: 1 // — The parameter &apiv=1 defines the api version to use (currently always set to 1)

  urlref?: string // The full HTTP Referrer URL. This value is used to determine how someone got to your website (ie, through a website, search engine or campaign).
  res?: string // — The resolution of the device the visitor is using, eg 1280x1024.
  h?: number // — The current hour (local time).
  m?: number // — The current minute (local time).
  s?: number // — The current second (local time).
  cookie?: 1 // — when set to 1, the visitor's client is known to support cookies.

  ua?: string // — An override value for the User-Agent HTTP header field. The user agent is used to detect the operating system and browser used.

  uadata?: string // — JSON encoded Client Hints collected by javascript. This will be used to enrich the detected user agent data. (requires Matomo 4.12.0)
  lang?: string // — An override value for the Accept-Language HTTP header field. This value is used to detect the visitor's country if GeoIP is not enabled.
  uid?: string // — defines the User ID for this request. User ID is any non-empty unique string identifying the user (such as an email address or a username). To access this value, users must be logged-in in your system so you can fetch this user ID from your system, and pass it to Matomo. The User ID appears in the visits log, the Visitor profile, and you can Segment reports for one or several User ID (userId segment). When specified, the User ID will be "enforced". This means that if there is no recent visit with this User ID, a new one will be created. If a visit is found in the last 30 minutes with your specified User ID, then the new action will be recorded to this existing visit.
  cid?: string // — defines the visitor ID for this request. You must set this value to exactly a 16 character hexadecimal string (containing only characters [0-9a-zA-Z]+). We recommended setting the User ID via uid rather than use this cid.
  new_visit?: 1 //  — If set to 1, will force a new visit to be created for this action. This feature is also available in JavaScript.
  dimension?: string[] // — A Custom Dimension value for a specific Custom Dimension ID (requires Matomo 2.15.1 + Custom Dimensions plugin see the Custom Dimensions guide). If Custom Dimension ID is 2 use dimension2=dimensionValue to send a value for this dimension. The configured Custom Dimension has to be in scope "Visit".
  _cvar?: string // — Visit scope custom variables. This is a JSON encoded string of the custom variable array (see below for an example value). (Note: it is recommended to use "Custom Dimensions" instead of "Custom Variables")

  _rcn?: string // — The Campaign name used to attribute goal conversions. (Note: this will only be used to attribute goal conversions, not visits)
  _rck?: string // — The Campaign keyword used to attribute goal conversions. (Note: this will only be used to attribute goal conversions, not visits)

  cvar?: string // — Page scope custom variables. This is a JSON encoded string of the custom variable array (see below for an example value).
  link?: string // — An external URL the user has opened. Used for tracking outlink clicks. We recommend to also set the url parameter to this same value.
  download?: string // — URL of a file the user has downloaded. Used for tracking downloads. We recommend to also set the url parameter to this same value.
  search?: string // — The Site Search keyword. When specified, the request will not be tracked as a normal pageview but will instead be tracked as a Site Search request.
  search_cat?: string // — when search is specified, you can optionally specify a search category with this parameter.
  search_count?: number // — when search is specified, we also recommend setting the search_count to the number of search results displayed on the results page. When keywords are tracked with &search_count=0 they will appear in the "No Result Search Keyword" report.
  pv_id?: string // — Accepts a six character unique ID that identifies which actions were performed on a specific page view. When a page was viewed, all following tracking requests (such as events) during that page view should use the same pageview ID. Once another page was viewed a new unique ID should be generated. Use [0-9a-Z] as possible characters for the unique ID.
  idgoal?: string // — If specified, the tracking request will trigger a conversion for the goal of the website being tracked with this ID.
  revenue?: string // — A monetary value that was generated as revenue by this goal conversion. Only used if idgoal is specified in the request.
  cs?: string // — The charset of the page being tracked. Specify the charset if the data you send to Matomo is encoded in a different character set than the default utf-8.
  ca?: 1 // — Stands for custom action. &ca=1 can be optionally sent along any tracking request that isn't a page view. For example it can be sent together with an event tracking request e_a=Action&e_c=Category&ca=1. The advantage being that should you ever disable the event plugin, then the event tracking requests will be ignored vs if the parameter is not set, a page view would be tracked even though it isn't a page view. For more background information check out #16570. Do not use this parameter together with a ping=1 tracking request.

  // performance fields
  pf_net?: string // — Network time. How long it took to connect to server.
  pf_srv?: string // — Server time. How long it took the server to generate page.
  pf_tfr?: string // — Transfer time. How long it takes the browser to download the response from the server
  pf_dm1?: string // — Dom processing time. How long the browser spends loading the webpage after the response was fully received until the user can start interacting with it.
  pf_dm2?: string // — Dom completion time. How long it takes for the browser to load media and execute any Javascript code listening for the DOMContentLoaded event.
  pf_onl?: string // — Onload time. How long it takes the browser to execute Javascript code waiting for the window.load event.

  // event fields
  e_c?: string // — The event category. Must not be empty. (eg. Videos, Music, Games...)
  e_a?: string // — The event action. Must not be empty. (eg. Play, Pause, Duration, Add Playlist, Downloaded, Clicked...)
  e_n?: string // — The event name. (eg. a Movie name, or Song name, or File name...)
  e_v?: number // — The event value. Must be a float or integer value (numeric), not a string.

  c_n?: string // — The name of the content. For instance 'Ad Foo Bar'
  c_p?: string // — The actual content piece. For instance the path to an image, video, audio, any text
  c_t?: string // — The target of the content. For instance the URL of a landing page
  c_i?: string // — The name of the interaction with the content. For instance a 'click'
}

export type MatomoClientProps = {
  matomoBaseUrl: string
  serverBaseUrl: string
  idsite: number
}

export class MatomoClient {
  private agent: AxiosInstance

  constructor(private readonly props: MatomoClientProps) {
    if (this.isDisabled()) {
      console.info("MatomoClient disabled")
    } else {
      console.info("MatomoClient connected", this.props)
    }
    this.agent = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    })
  }

  isDisabled() {
    const { matomoBaseUrl, idsite, serverBaseUrl } = this.props
    return !matomoBaseUrl || !idsite || isNaN(idsite) || !serverBaseUrl
  }

  /**
   * Sends a low level Matomo event. Use only if no other method fits your usage.
   * @param event Low level matomo event
   */
  async sendRaw(event: Partial<MatomoPayload>) {
    if (this.isDisabled()) return
    try {
      const { agent, props } = this
      const { matomoBaseUrl, idsite, serverBaseUrl } = props
      const now = dayjs(new Date()).tz("Europe/Paris")
      const isEvent = event.e_c || event.e_a || event.e_n || event.e_v !== undefined
      const finalEvent: MatomoPayload = {
        ...event,
        idsite,
        rec: 1,
        rand: Math.random().toString().substring(2),
        apiv: 1,
        ca: isEvent ? 1 : undefined,
        url: event.url ? serverBaseUrl + event.url : undefined,
        h: now.get("hours"),
        m: now.get("minutes"),
        s: now.get("seconds"),
      }
      const matomoUrl = `${matomoBaseUrl}/matomo.php`
      const response = await agent.get(matomoUrl, {
        params: finalEvent,
      })
      if (response.status !== 200) {
        throw new Error(`got response: status=${response.status} body=${response.data}`)
      }
    } catch (err) {
      const message = `error while sending matomo event: ${JSON.stringify(event)}`
      console.error(message, err)
    }
  }
  async sendFromRequest(request: Request, event: Partial<MatomoPayload>) {
    const { headers } = request
    const userId = "remy.auricoste"
    const urlPath = (request.baseUrl || "") + (request.url || "")
    const userHash = createHash("sha256").update(userId).digest("hex")
    const finalEvent = {
      ...event,
      url: urlPath,
      _id: userHash.substring(0, 16),
      urlref: headers["referer"],
      ua: headers["user-agent"],
      lang: headers["accept-language"],
      uid: userId,
    }
    return matomoClient.sendRaw(finalEvent)
  }
}

export const matomoClient = new MatomoClient({
  serverBaseUrl: process.env.LBA_MATOMO_SITE_URL,
  matomoBaseUrl: process.env.LBA_MATOMO_SERVER_URL,
  idsite: parseInt(process.env.LBA_MATOMO_ID_SITE),
})
