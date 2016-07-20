# Loopback Finite State Machine

[![Circle CI](https://circleci.com/gh/fullcube/loopback-component-fsm.svg?style=svg)](https://circleci.com/gh/fullcube/loopback-component-fsm) [![Dependencies](http://img.shields.io/david/fullcube/loopback-component-fsm.svg?style=flat)](https://david-dm.org/fullcube/loopback-component-fsm) [![Coverage Status](https://coveralls.io/repos/github/fullcube/loopback-component-fsm/badge.svg?branch=master)](https://coveralls.io/github/fullcube/loopback-component-fsm?branch=master)

This loopback component provides a finite state machine (powered by https://github.com/vstirbu/fsm-as-promised) for loopback model instances, enabling precise control over when model instance methods may be called.

When a model method that is controlled by the Finite State Machine is called it will set a global lock that will prevent other copies of the same instance from being transitioned whist the existing transition is still underway. The state machine governs which state transitions may take place at any time given the current state of the instance and handles state change persistence on completion of a given transition.

## Installation

1. Install in you loopback project:

  `npm install --save loopback-component-fsm`

2. Create a component-config.json file in your server folder (if you don't already have one)

3. Enable the component inside `component-config.json`.

  ```json
  {
    "loopback-component-fsm": { }
  }
  ```

## Configuration

1. Define a state machine events in the mixin configuration for you models.

  ```json
  "mixins": {
    "StateMachine": {
      "stateProperty": "status",
      "events": [
        { "name": "activate", "from": "none", "to": "active" },
        { "name": "cancel", "from": "active", "to": "canceled" },
        { "name": "reactivate", "from": "canceled", "to": "active" },
        { "name": "expire", "from": [ "active", "canceled" ], "to": "expired" }
      ]
    }
  }
  ```

**Options:**

- `stateProperty`

  [String] : The name of the model's state property. *(default: 'state')*

- `events`

  [Array] : A list of events available to the state machine. Refer to the [FSM As Promised documentation](https://github.com/vstirbu/fsm-as-promised) for details on how events should be defined. *(default: [])*

## Implementation:

For each event in the State Machine, a series of model notifications will be sent - one for each stage in a transition - in the following order:

| callback | state in which the notification executes | description |
| --- | --- | --- |
| fsm:onleave{stateName} | from | do something when leaving state stateName |
| fsm:onleave | from | do something when leaving any state |
| fsm:on{eventName} | _from_ | do something when executing the transition |
| fsm:onenter{stateName} | _from_ | do something when entering state stateName |
| fsm:onenter | _from_ | do something when entering any state |
| fsm:onentered{stateName} | to | do something after entering state stateName (transition is complete) |
| fsm:onentered | to | do something after entering any state (transition is complete) |

You can act on any of these transition stages by observing the notification. For example:

```javascript
MyModel.observe('fsm:oncancel', ctx => ctx.instance.doSomething().then(() => ctx))
```

If you intend to perform an asynchronous operation in a given transition stage, your observer should return a promise that resolves to the `ctx` argument that was passed to it. Otherwise, you should simply return the `ctx` object.

**Return values**

The `ctx` object will be passed through the entire transition call chain and returned to the original caller. If you would like your caller to receive something other than the full `ctx` object you can set `ctx.res` which will be returned instead. [More information](https://github.com/vstirbu/fsm-as-promised#returned-values)

## Usage

Prototype methods will be attached to model instances for each of the named events in your mixin configuration. For
example, the above mixin configuration will result in the following methods being added to MyModel.

- `MyModel.prototype.activate`
- `MyModel.prototype.cancel`
- `MyModel.prototype.reactivate`
- `MyModel.prototype.expire`

These methods can be called as any other:

```javascript
MyModel.findOne()
  .then(instance => {
    log.debug(`Current state is: ${instance.state}`) // Current state is: active
    return instance.cancel()
  })
  .then(instance => {
    log.debug(`Current state is: ${instance.state}`) // Current state is: canceled
    return instance.reactivate()
  })
  .then(instance => {
    log.debug(`Current state is: ${instance.state}`) // Current state is: active
  })
```

In this example, a model instance is loaded from the database and a finite state machine is initialized using the current status of the model instance. The instance is then transitioned to the canceled state, then back to the active state.


## More Information

Please refer to the [FSM As Promised](https://github.com/vstirbu/fsm-as-promised) documentation for more detail on the internals of the state machine implementation.
