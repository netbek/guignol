var _ = require('lodash');
var chalk = require('chalk');
var EventEmitter = require('events');
var Nightmare = require('nightmare');
var Promise = require('bluebird');

/**
 *
 * @param   {Object} config
 * @returns {Guignol}
 */
function Guignol(config) {
  EventEmitter.call(this);

  this.config = _.assign({
    nightmare: {
      show: false
    },
    tasks: []
  }, config);

  var self = this;
  var nightmare = Nightmare(this.config.nightmare);
  var useTasks = {};

  _.forEach(this.config.tasks, function (tasks) {
    _.forEach(tasks, function (taskFn, taskName) {
      useTasks[taskName] = taskFn;
    });
  });

  nightmare.on('did-get-response-details', function (event, status, newURL, originalURL, httpResponseCode, requestMethod, referrer, headers, resourceType) {
    // Client (400) or server (500) error
    if (httpResponseCode >= 400) {
      // self.emit('httpError', newURL, httpResponseCode);
      console.log('  ', chalk.yellow(httpResponseCode), newURL);
    }
  });

  this.nightmare = nightmare;
  this.tasks = useTasks;
}

Guignol.prototype = _.create(EventEmitter.prototype, {
  constructor: Guignol,
  /**
   * Runs the given Nightmare tasks.
   *
   * @param   {Array} tasks
   * @returns {Promise}
   */
  runTasks: function (tasks) {
    var self = this;

    return new Promise(function (resolve, reject) {
      _.forEach(tasks, function (value, index) {
        var task = value[0];
        var args = _.slice(value, 1);

        if (_.has(self.tasks, task)) {
          self.nightmare.use(self.tasks[task].apply(self.nightmare, args));
        }
        else {
          self.nightmare[task].apply(self.nightmare, args);
        }
      });

      return self.nightmare.end()
        .then(function () {
          resolve.apply(self.nightmare, arguments);
        }, reject);
    });
  }
});

module.exports = {
  Guignol: Guignol
};
