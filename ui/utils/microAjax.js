/*global XMLHttpRequest */

// Copy/pasted from https://github.com/le717/microajax/blob/master/microajax.js

/**
 * Perform a simple async AJAX request.
 * @param {Object} options.<[method=GET], url, data,
 *                                        [success=function], [warning=function], [error=function]>
 *                 method: GET or POST.
 *                 url: The URL to contact.
 *                 data: the content to send to the page.
 *                 success: Code to run on request success.
 *                 warning: Code to run on request warning.
 *                 error: Code to run on request error.
 */
export default function microAjax(options) {
  "use strict";

  // Default to GET
  if (!options.method) {
    options.method = "GET";
  }

  // Default empty functions for the callbacks
  function noop() {}
  if (!options.success) {
    options.success = noop;
  }
  if (!options.warning) {
    options.warning = noop;
  }
  if (!options.error) {
    options.error = noop;
  }

  var request = new XMLHttpRequest();
  request.open(options.method, options.url, true);
  request.send(options.data);

  request.onload = function() {
    // Success!
    if (request.readyState === 4 && request.status === 200) {
      options.success(request.responseText);

      // We reached our target destination, but it returned an error
    } else {
      options.warning();
    }
  };

  // There was a connection error of some sort
  request.onerror = options.error;
}
