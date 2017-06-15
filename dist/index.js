'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createSocketIoMiddleware;

/**
* Allows you to register actions that when dispatched, send the action to the
* server via a socket.io socket.
* `criteria` may be a function (type, action) that returns true if you wish to send the
*  action to the server, array of action types, or a string prefix.
* the third parameter is an options object with the following properties:
* {
*   eventName,// a string name to use to send and receive actions from the server.
*   execute, // a function (action, emit, next, dispatch) that is responsible for
*            // sending the message to the server.
* }
*
*/
var ACTION_NAME_ON = exports.ACTION_NAME_ON = 'SOCKET_IO_ON/';
var ACTION_NAME_EMIT = exports.ACTION_NAME_EMIT = 'SOCKET_IO_EMIT/';

function createSocketIoMiddleware(socket) {
  var criteria = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ACTION_NAME_EMIT;

  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref$events = _ref.events,
      events = _ref$events === undefined ? ['connect'] : _ref$events,
      _ref$execute = _ref.execute,
      execute = _ref$execute === undefined ? defaultExecute : _ref$execute,
      _ref$actionName = _ref.actionName,
      actionName = _ref$actionName === undefined ? ACTION_NAME_ON : _ref$actionName;

  var emitBound = socket.emit.bind(socket);
  return function (_ref2) {
    var dispatch = _ref2.dispatch;

    // Wire socket.io to dispatch actions sent by the server.
    events.forEach(function (event) {
      socket.on(event, function (data) {
        return dispatch({ type: actionName + event, data: data });
      });
    });
    return function (next) {
      return function (action) {
        if (evaluate(action, criteria)) {
          return execute(action, emitBound, next, dispatch);
        }
        return next(action);
      };
    };
  };

  function evaluate(action, option) {
    if (!action || !action.type) {
      return false;
    }

    var type = action.type;

    var matched = false;
    if (typeof option === 'function') {
      // Test function
      matched = option(type, action);
    } else if (typeof option === 'string') {
      // String prefix
      matched = type.indexOf(option) === 0;
    } else if (Array.isArray(option)) {
      // Array of types
      matched = option.some(function (item) {
        return type.indexOf(item) === 0;
      });
    }
    return matched;
  }

  function defaultExecute(action, emit, next, dispatch) {
    // eslint-disable-line no-unused-vars
    emit(action.event, action.data);
    return next(action);
  }
}