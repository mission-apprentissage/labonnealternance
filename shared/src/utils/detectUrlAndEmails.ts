// cf https://data.iana.org/TLD/tlds-alpha-by-domain.txt

import { removeAccents } from "./stringUtils.js"

// domains with length <= 3
const shortTldStr =
  "AAA,ABB,ABC,AC,ACO,AD,ADS,AE,AEG,AF,AFL,AG,AI,AIG,AL,AM,ANZ,AO,AOL,APP,AQ,AR,ART,AS,AT,AU,AW,AWS,AX,AXA,AZ,BA,BAR,BB,BBC,BBT,BCG,BCN,BD,BE,BET,BF,BG,BH,BI,BID,BIO,BIZ,BJ,BM,BMS,BMW,BN,BO,BOM,BOO,BOT,BOX,BR,BS,BT,BUY,BV,BW,BY,BZ,BZH,CA,CAB,CAL,CAM,CAR,CAT,CBA,CBN,CC,CD,CEO,CF,CFA,CFD,CG,CH,CI,CK,CL,CM,CN,CO,COM,CPA,CR,CRS,CU,CV,CW,CX,CY,CZ,DAD,DAY,DDS,DE,DEV,DHL,DIY,DJ,DK,DM,DNP,DO,DOG,DOT,DTV,DVR,DZ,EAT,EC,ECO,EDU,EE,EG,ER,ES,ESQ,ET,EU,EUS,FAN,FI,FIT,FJ,FK,FLY,FM,FO,FOO,FOX,FR,FRL,FTR,FUN,FYI,GA,GAL,GAP,GAY,GB,GD,GDN,GE,GEA,GF,GG,GH,GI,GL,GLE,GM,GMO,GMX,GN,GOO,GOP,GOT,GOV,GP,GQ,GR,GS,GT,GU,GW,GY,HBO,HIV,HK,HKT,HM,HN,HOT,HOW,HR,HT,HU,IBM,ICE,ICU,ID,IE,IFM,IL,IM,IN,INC,ING,INK,INT,IO,IQ,IR,IS,IST,IT,ITV,JCB,JE,JIO,JLL,JM,JMP,JNJ,JO,JOT,JOY,JP,KE,KFH,KG,KH,KI,KIA,KIM,KM,KN,KP,KPN,KR,KRD,KW,KY,KZ,LA,LAT,LAW,LB,LC,LDS,LI,LK,LLC,LLP,LOL,LPL,LR,LS,LT,LTD,LU,LV,LY,MA,MAN,MAP,MBA,MC,MD,ME,MED,MEN,MG,MH,MIL,MIT,MK,ML,MLB,MLS,MM,MMA,MN,MO,MOE,MOI,MOM,MOV,MP,MQ,MR,MS,MSD,MT,MTN,MTR,MU,MV,MW,MX,MY,MZ,NA,NAB,NBA,NC,NE,NEC,NET,NEW,NF,NFL,NG,NGO,NHK,NI,NL,NO,NOW,NP,NR,NRA,NRW,NTT,NU,NYC,NZ,OBI,OM,ONE,ONG,ONL,OOO,ORG,OTT,OVH,PA,PAY,PE,PET,PF,PG,PH,PHD,PID,PIN,PK,PL,PM,PN,PNC,PR,PRO,PRU,PS,PT,PUB,PW,PWC,PY,QA,RE,RED,REN,RIL,RIO,RIP,RO,RS,RU,RUN,RW,RWE,SA,SAP,SAS,SB,SBI,SBS,SC,SCB,SD,SE,SEW,SEX,SFR,SG,SH,SI,SJ,SK,SKI,SKY,SL,SM,SN,SO,SOY,SPA,SR,SRL,SS,ST,STC,SU,SV,SX,SY,SZ,TAB,TAX,TC,TCI,TD,TDK,TEL,TF,TG,TH,THD,TJ,TJX,TK,TL,TM,TN,TO,TOP,TR,TRV,TT,TUI,TV,TVS,TW,TZ,UA,UBS,UG,UK,UNO,UOL,UPS,US,UY,UZ,VA,VC,VE,VET,VG,VI,VIG,VIN,VIP,VN,VU,WED,WF,WIN,WME,WOW,WS,WTC,WTF,XIN,XXX,XYZ,YE,YOU,YT,YUN,ZA,ZIP,ZM,ZW"
const weirdEncodedTldStr =
  "कॉम,セール,佛山,ಭಾರತ,慈善,集团,在线,한국,ଭାରତ,点看,คอม,ভাৰত,ভারত,八卦,ישראל,موقع,বাংলা,公益,公司,香格里拉,网站,移动,我爱你,москва,қаз,католик,онлайн,сайт,联通,срб,бг,бел,קום,时尚,微博,淡马锡,ファッション,орг,नेट,ストア,アマゾン,삼성,சிங்கப்பூர்,商标,商店,商城,дети,мкд,ею,ポイント,新闻,家電,كوم,中文网,中信,中国,中國,娱乐,谷歌,భారత్,ලංකා,電訊盈科,购物,クラウド,ભારત,通販,भारतम्,भारत,भारोत,网店,संगठन,餐厅,网络,ком,укр,香港,亚马逊,食品,飞利浦,台湾,台灣,手机,мон,الجزائر,عمان,ارامكو,ایران,العليان,امارات,بازار,موريتانيا,پاکستان,الاردن,بارت,بھارت,المغرب,ابوظبي,البحرين,السعودية,ڀارت,كاثوليك,سودان,همراه,عراق,مليسيا,澳門,닷컴,政府,شبكة,بيتك,عرب,გე,机构,组织机构,健康,ไทย,سورية,招聘,рус,рф,تونس,大拿,ລາວ,みんな,グーグル,ευ,ελ,世界,書籍,ഭാരതം,ਭਾਰਤ,网址,닷넷,コム,天主教,游戏,vermögensberater,vermögensberatung,企业,信息,嘉里大酒店,嘉里,مصر,قطر,广东,இலங்கை,இந்தியா,հայ,新加坡,فلسطين,政务"

const detectedTlds = [...shortTldStr.split(","), ...weirdEncodedTldStr.split(",")].map((x) => x.toLocaleLowerCase())
const isShortTld = (maybeTld: string) => detectedTlds.includes(maybeTld)

const legitimateTldLikes = ["es", "se"]
const tldChars = [...new Set(detectedTlds.flatMap((tld) => tld.split("")))].join("")

export const detectUrlAndEmails = (str: string): { index: number; length: number }[] => {
  let cleanedStr = removeAccents(str.toLocaleLowerCase())
  cleanedStr = cleanedStr.replaceAll(new RegExp(`\\.[^./${tldChars}-]+`, "g"), ".")
  cleanedStr = cleanedStr.replaceAll(new RegExp(`[^./: ${tldChars}-]`, "g"), "z")
  const regexp = new RegExp(`([a-z0-9_/${tldChars}-]+\\.)+[${tldChars}-]{2,}`, "g")
  let match = regexp.exec(cleanedStr)

  const result: { index: number; length: number }[] = []
  while (match) {
    const matchedStr = match[0]
    const matchedTld = matchedStr.split(".").at(-1)?.toLowerCase()
    if (!(matchedTld && (isShortTld(matchedTld) || matchedTld.startsWith("xn--")))) {
      match = regexp.exec(cleanedStr)
      continue
    }
    let startIndex = str.substring(0, match.index).lastIndexOf(" ")
    if (startIndex === -1) {
      startIndex = 0
    } else {
      startIndex += 1
    }
    const rightIndex = match.index + matchedStr.length
    let endIndex = str.substring(rightIndex).indexOf(" ")
    if (endIndex === -1) {
      endIndex = str.length
    } else {
      endIndex += rightIndex
    }
    const length = endIndex - startIndex
    const completeMatchedWord = str.substring(startIndex, startIndex + length)
    if (!(legitimateTldLikes.includes(matchedTld) && completeMatchedWord.split(".").length === 2)) {
      result.push({
        index: startIndex,
        length,
      })
    }
    match = regexp.exec(cleanedStr)
  }
  return result
}
