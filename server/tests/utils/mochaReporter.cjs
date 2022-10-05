const util = require("util");
const Mocha = require("mocha"); // eslint-disable-line node/no-unpublished-require
const chalk = require("chalk"); // eslint-disable-line node/no-unpublished-require
const { Base, Spec } = Mocha.reporters;
const { inherits } = require("util");
const prettyMilliseconds = require("pretty-ms"); // eslint-disable-line node/no-unpublished-require
const color = Base.color;
const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_PENDING,
} = Mocha.Runner.constants;

const log = Base.consoleLog;

function stringifyDiffObjs(err) {
  if (typeof err.actual !== "string" || typeof err.expected !== "string") {
    err.actual = util.stringify(err.actual);
    err.expected = util.stringify(err.expected);
  }
}

function logFailures(failures) {
  log();

  var multipleErr, multipleTest;
  failures.forEach(function (test, i) {
    // format
    var fmt = color("error title", "  %s) %s:\n") + color("error message", "     %s") + color("error stack", "\n%s\n");

    // msg
    var msg;
    var err;
    if (test.err && test.err.multiple) {
      if (multipleTest !== test) {
        multipleTest = test;
        multipleErr = [test.err].concat(test.err.multiple);
      }
      err = multipleErr.shift();
    } else {
      err = test.err;
    }
    var message;
    if (typeof err.inspect === "function") {
      message = err.inspect() + "";
    } else if (err.message && typeof err.message.toString === "function") {
      message = err.message + "";
    } else {
      message = "";
    }
    var stack = err.stack || message;
    var index = message ? stack.indexOf(message) : -1;

    if (index === -1) {
      msg = message;
    } else {
      index += message.length;
      msg = stack.slice(0, index);
      // remove msg from stack
      stack = stack.slice(index + 1);
    }

    // uncaught
    if (err.uncaught) {
      msg = "Uncaught " + msg;
    }
    // explicitly show diff
    if (Base.showDiff(err)) {
      stringifyDiffObjs(err);
      fmt = color("error title", "  %s) %s:\n%s") + color("error stack", "\n%s\n");
      var match = message.match(/^([^:]+): expected/);
      msg = "\n      " + color("error message", match ? match[1] : msg);

      msg += Base.generateDiff(err.actual, err.expected);
    }

    // indent stack trace
    stack = stack.replace(/^/gm, "  ");

    // indented test title
    var testTitle = "";
    let titlePath = test.titlePath();
    titlePath[0] = chalk.magenta(titlePath[0]);
    titlePath.forEach(function (str, index) {
      if (index !== 0) {
        testTitle += "\n     ";
      }
      for (var i = 0; i < index; i++) {
        testTitle += "  ";
      }
      testTitle += str;
    });

    let errorAsString = err.name === "MongoServerError" ? chalk.grey(`${util.inspect(err, { depth: null })}`) : stack;
    log(...[fmt, i + 1, testTitle, msg, errorAsString]);
  });
  log();
}

function summary(stats) {
  log();

  // passes
  log(
    color("bright pass", " ") + color("green", " %d passing") + color("light", " (%s)"),
    stats.passes || 0,
    prettyMilliseconds(stats.duration)
  );

  if (stats.pending) {
    log(color("pending", " ") + color("pending", " %d pending"), stats.pending);
  }

  if (stats.failures) {
    log(color("fail", "  %d failing"), stats.failures);
  }

  log();
}

function epilogue(stats, failures) {
  if (stats.failures) {
    logFailures(failures);
  }

  summary(stats);
}

function MochaReporter(runner, options) {
  Base.call(this, runner, options);
  var self = this;
  var indents = 0;
  var n = 0;

  function indent() {
    return Array(indents).join("  ");
  }

  runner.on(EVENT_RUN_BEGIN, function () {
    log();
    log(indent() + "********** TESTS **********");
  });

  runner.on(EVENT_SUITE_BEGIN, function (suite) {
    ++indents;
    log(color("suite", "%s%s"), indent(), chalk.magenta(suite.title));
  });

  runner.on(EVENT_SUITE_END, function () {
    --indents;
    if (indents === 1) {
      log();
    }
  });

  runner.on(EVENT_TEST_PENDING, function (test) {
    var fmt = indent() + color("pending", "  - %s");
    log(fmt, test.title);
  });

  runner.on(EVENT_TEST_PASS, function (test) {
    var fmt;
    if (test.speed === "fast") {
      fmt = indent() + color("checkmark", "  " + Base.symbols.ok) + color("green", " %s");
      log(fmt, test.title);
    } else {
      fmt =
        indent() + color("checkmark", "  " + Base.symbols.ok) + color("green", " %s") + color(test.speed, " (%dms)");
      log(fmt, test.title, test.duration);
    }
  });

  runner.on(EVENT_TEST_FAIL, function (test) {
    log(indent() + color("fail", "  %d) %s"), ++n, test.title);
  });

  runner.once(EVENT_RUN_END, function () {
    log(indent() + "********** SUMMARY ********** ");
    epilogue(self.stats, self.failures);
  });
}

inherits(MochaReporter, Spec);

MochaReporter.description = "Same as spec but with all error properties";
exports = module.exports = MochaReporter;
