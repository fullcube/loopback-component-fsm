# Loopback Finite State Machine

This loopback component provides a finite state machine for loopback model instances.

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
