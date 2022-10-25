const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const advancedFormat = require("dayjs/plugin/advancedFormat");
const duration = require("dayjs/plugin/duration");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const isBetween = require("dayjs/plugin/isBetween");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const isYesterday = require("dayjs/plugin/isYesterday");

dayjs.extend(utc);
dayjs.extend(duration);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(isYesterday);

/**
 * @description Formats date.
 * @param {string} date
 * @returns {string|void}
 */
const formatDate = (date) => {
  if (!date) {
    return;
  }

  return dayjs.tz(date, "Europe/Paris").format("DD/MM/YYYY");
};

/**
 * @description Formats date.
 * @param {string} date
 * @returns {string|void}
 */
const formatDatetime = (date) => {
  if (!date) {
    return;
  }

  return dayjs.tz(date, "Europe/Paris").format("DD/MM/YYYY HH:mm:ss");
};

module.exports = {
  dayjs,
  formatDate,
  formatDatetime,
};
