# Loopback Finite State Machine

This loopback component provides a finite state machine (powered by https://github.com/vstirbu/fsm-as-promised) for loopback model instances, enabling precise control over when model instance methods may be called.

### Installation

1. Install in you loopback project:

  `npm install --save loopback-component-fsm`

2. Create a component-config.json file in your server folder (if you don't already have one)

3. Configure options inside `component-config.json`. *(see configuration section)*

  ```json
  {
    "loopback-component-fsm": {
      "{option}": "{value}"
    }
  }
  ```

### Usage

1. Define a state machine config on Model.STATEMACHINE property.

2. Load and use the state machine for a given instance

  ```(javascript)
  const fsm = app.getStateMachine(instance)
  fsm.doSomething(instance)
    .then(() => cb())
    .catch(cb)
  ```


### TODO:

- Provide/document a means to control what data gets returned.
