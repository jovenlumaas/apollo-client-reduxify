# apollo-client-reduxify

A lightweight redux-like implementation of @apollo/client's reactive state
management solution. If you're working a project both using apollo-client 3+ and
redux, then you have a redundant state management. You may consider dropping
redux and adopt the apollo-client's local state management solution using this
package.

### apollo-client-reduxify does and doesn't have from redux

- redux is a state management solution while apollo-client-reduxify is a toolkit
  for a redux-like implementation of @apollo/client state management solution
  using reactive variables.

- redux is a single large state tree while apollo-client-reduxify state is
  composed of many state trees. This allows react component to RE-RENDER ONLY
  based on the affected state change.

- just like redux, apollo-client-reduxify implements reducers and selectors. But
  in apollo-client-reduxify, since it is composed of many state trees
  independently, each case reducer can access the other state trees via context
  as third argument. This allows the developer to easily access the other state trees
  to be used for a case reducer's code logic.

- each case reducer can dispatch other reducer's action since it can access
  reactive variables thru context as third argument (be cautious of dispatching
  an action via reducer, this may create a circular dispatching actions).

- redux requires too much boilerplate code while apollo-client-reduxify
  implements a concise way of implementing a strongly typed reducers and
  selectors.

- apollo-client-reduxify provides strongly typed utility functions for
  dispatching an action and consuming a state (via selectors).

- in apollo-client-reduxify, the developer has the flexibility to persist a state
  tree and keep the other state trees not to persist. Unlike in redux, you have to
  persist the whole large state tree, if needed.

- both have reactivity during a state change.

- apollo-client-reduxify doesn't have middleware features YET.

## Installation

    npm install apollo-client-reduxify

## How to use?

### `Creating Reactive Variable Context (reactiveVar, reducers, selectors)`

```js
import { createReactiveVar } from 'apollo-client-reduxify';

// for ./notifications.js
const initialState = {
  isOpen: false,
  message: '',
};

export const notificationsVar = createReactiveVar({
  name: 'notificationsVar',
  initialState,
  reducers: {
    setNotificationShow: (state, payload) => ({
      ...state,
      isOpen: true,
      message: payload,
    }),
    setNotificationHide: () => initialState,
  },
  selectors: {
    getNotification: (s) => s,
    getNotificationMessage: (s) => s.message,
  },
});

// for ./modals.js
const initialState = {
  isOpen: false,
  promptMessage: '',
};

export const modalsVar = createReactiveVar({
  name: 'modalsVar',
  // you have the option to persist a state tree, and keep the other state trees not to persist.
  persistTo: 'sessionStorage',
  initialState,
  reducers: {
    // you can access other state trees or even dispatch an action via 'context' argument
    setModalShow: (state, payload, context) => {
      const { reactiveVars } = context;
      const notificationsState = reactiveVars.notificationsVar();

      // ... your code logic using 'notificationsState'

      return {
        ...state,
        isOpen: true,
        promptMessage: payload,
      };
    },
    setModalHide: () => initialState,
  },
  selectors: {
    getModal: (s) => s,
  },
});
```

### `Combining Reactive Variable Instances`

```js
// for ./rootVars

import { mergeReactiveVars } from 'apollo-client-reduxify';

import { notificationsVar } from './notifications';
import { modalsVar } from './modals';

export default mergeReactiveVars({
  notificationsVar,
  modalsVar,
});
```

### `Creating a store and accessing utility functions`

```js
// for ./reduxify

import { createReactiveVarStore } from 'apollo-client-reduxify';

import rootVars from './rootVars';

const {
  dispatch, // use to dispatch an action
  useReadReactiveVar, // hook version for accessing a state
  readReactiveVar, // non-hook version for accessing a state
  fieldTypes, // !IMPORTANT: this should be passed during creation of apollo's 'inMemoryCache'
  reactiveVars, // the created reactive variables (in this case, 'notificationsVar' and 'modalsVar')
} = createReactiveVarStore(rootVars, {
  // you can log the dispatched actions with flexibility.
  // If set to true, all the dispatched actions will be logged.
  // You can pass an array to select a partcular state to log.
  enableLog: false, // true or ["modalsVar", ...etc]
  context: {
    // ... you can add an additional context here to access by all reducers
    // for a logic or running a function purposes
  },
});

// EXPORT ALL
export { dispatch, useReadReactiveVar, readReactiveVar, fieldTypes, reactiveVars };
```

### Connecting Reactive Variables to Apollo Client's Cache

```js
import { InMemoryCache, ApolloClient } from '@apollo/client';
import { fieldTypes } from './reduxify';

const cache: InMemoryCache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        ...fieldTypes, // < --- IMPORTANT!!!
        // ...other field policies
      },
    },
  },
});

const client = new ApolloClient({
  cache,
  // ...other options
});
```

### `Consuming state and dispatching an action (for your react component)`

There are flexible ways of accessing state and dispatching an action:

1. Creating a 'connect' function and wrap your react component (like
   react-redux's mapStateToProps, mapDispatchToProps method)
2. Use directly the dispatch, useReadReactiveVar, and readReactiveVar helper
   functions.
3. via reactiveVars (see documentation
   ["Reactive variables"](https://www.apollographql.com/docs/react/local-state/reactive-variables)
   for more information).
4. via useQuery together with your graphql query (see the documentation about
   [Querying local state](https://www.apollographql.com/docs/react/v2/data/local-state/#querying-local-state)
   for more information).

#### OPTION 1. Creating a 'connect' function and wrap your react component

```js
import { createReactiveVarConnector } from 'apollo-client-reduxify';

// back to './reduxify file, add this code:

const reactiveVarConnector = createReactiveVarConnector(selectors, actions);

// EXPORT ALL
export {
  dispatch,
  useReadReactiveVar,
  readReactiveVar,
  fieldTypes,
  reactiveVars,
  reactiveVarConnector, // <--- newly added
};

// for './App

// 'reactiveVarConnector' function provides typescript intellisense like react-redux's 'connect' api.
// This means that all of your pre-defined 'selectors' and 'actions' will be provided by typescript
// to your component.
const connect = reactiveVarConnector(
  (selectors) => ({ notification: selectors.getNotification }),
  (actions) => ({ setNotificationShow: actions.setNotificationShow }),
);

const App = ({ notification, setNotificationShow }) => {
  return (
    <div>
      <p>`Notification: ${notification.message}`</p>
      <button onClick={() => setNotificationShow('Hello World!')}>Show Notification</button>;
    </div>
  );
};

export default connector(App);
```

#### OPTION 2. Use directly the dispatch, useReadReactiveVar, and readReactiveVar helper functions

```ts
//
import { dispatch, readReactiveVar } from './reduxify';

const toastNotificationShow = (message) => {
  // ....your code logic

  // all of the parameters are also powered by typescript
  // the first parameter is the 'action' to dispatch and the other is the 'payload'
  dispatch('setNotificationShow', message);
};

const getNotification = () => {
  // ...your code logic

  // the parameter is the 'selector' name which is also powered by typescript.
  return readReactiveVar('getNotification'); // or useReadReactiveVar("getNotification") if inside react component
};
```
