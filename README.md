# apollo-client-reduxify

A lightweight redux-like implementation of
[apollo-client](https://www.npmjs.com/package/@apollo/client)'s reactive state
management solution.

If you're working on a project using both apollo-client 3+ and
[redux](https://www.npmjs.com/package/redux), then definitely you have a
redundant state management. You may consider dropping redux (and react-redux, ...etc)
and adopt the apollo-client's local state management solution using this package.

## `Apollo's Reactive Variable API + Redux-like API = apollo-client-reduxify`

apollo-client-reduxify does and doesn't have from redux:

- redux is a state management solution while apollo-client-reduxify is a toolkit
  for a redux-like implementation of apollo-client's state management solution
  using reactive variables.

- redux is a single large state tree while apollo-client-reduxify state is
  composed of many state trees. This allows react component to RE-RENDER ONLY
  based on the affected state changes.

- just like redux, apollo-client-reduxify implements middleware, reducers, and
  selectors.

- in redux, a case reducer has two parameters (previous state and action) while
  in apollo-client-reduxify, it has three parameters (previous state, action,
  and context). The context parameter provides useful API and metadata
  which enables case reducer to access other reactive variable state, dispatch
  an action, or even execute a function (provided in store creation).

- apollo-client-reduxify provides a feature for watching the dispatched actions
  and the state changes. The developer has the option to watch only a particular
  state tree or all state trees.

- redux requires too much boilerplate code while apollo-client-reduxify
  implements concise and strongly typed reducers and selectors syntax.

- apollo-client-reduxify provides strongly typed API for
  dispatching an action and consuming a state (via selectors).

- in apollo-client-reduxify, the developer has the option to persist a
  particular state while keeping other state not to persist. Unlike in redux,
  you have to persist the whole large state tree, if needed.

- both have reactivity during a state change.

- the cool thing about apollo-client-reduxify is that all of the created state
  trees are just
  [reactive variables](https://www.apollographql.com/docs/react/local-state/reactive-variables),
  this means that the developer can still use reactive variables API provided by
  apollo-client.

## Installation

    npm install apollo-client-reduxify

## How to use?

### `Creating Reactive Variable Context (reactiveVars, reducers, selectors)`

```js
import { createReactiveVar } from 'apollo-client-reduxify';

// for './notifications.js'
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
    getNotificationMessage: (s, props) => {
      if (props.userId === 'me') {
        return null;
      } else {
        return s.message;
      }
    },
  },
});

// for './modals.js'
const initialState = {
  isOpen: false,
  promptMessage: '',
};

export const modalsVar = createReactiveVar({
  name: 'modalsVar',
  // you have the option to persist a particular state, while keeping others not to persist.
  persistTo: 'sessionStorage',
  initialState,
  reducers: {
    // you can access other reactive variable state or even dispatch an action via 'context' argument.
    // 'context' includes default API such as 'dispatch','reactiveVars', and 'nonHookSelectors'.
    // the developer can add metadata to this context during 'store' creation under context option
    setModalShow: (state, payload, context) => {
      const { reactiveVars, logger } = context;
      const notificationsState = reactiveVars.notificationsVar();

      // ... your code logic using 'notificationsState'

      logger("dispatched action: 'setModalShow'");

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
// for './rootVars'

import { mergeReactiveVars } from 'apollo-client-reduxify';

import { notificationsVar } from './notifications';
import { modalsVar } from './modals';

export default mergeReactiveVars({
  notificationsVar,
  modalsVar,
});
```

### `Creating a store and accessing its API`

```js
// for './store'

import { createReactiveVarStore, applyMiddleware } from "apollo-client-reduxify";

import rootVars from "./rootVars";


const store = createReactiveVarStore(rootVars, {
  enableLog: true, // or ["modalsVar", ...etc] if you want to log a particular state only
  context: {
      // ... you can provide an additional context here to access by all reducers
      // for a logic or running a function purposes. We add a logger in this case.
      logger(value){
          console.log(value)
      }
  },
  middleware // you can add an optional middleware
});


const middleware = applyMiddleware(
  ({ reactiveVars, dispatch }) =>
    (action, next) => {
      console.log("this is middleware 1");
      if (action.type === "setModalShow") dispatch("otherAction...", {});
      next();
    }
  () => (action, next) => {
    next();
    console.log("this is middleware 2");
  }
);


export default store;
```

### Connecting Reactive Variables to Apollo Client's Cache

```js
import { InMemoryCache, ApolloClient } from '@apollo/client';
import store from './store';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        ...store.fieldTypes, // < --- IMPORTANT!!!
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

### `Consuming a state and dispatching an action (for your react component)`

There are flexible ways of accessing a state and dispatching an action:

1. wrapping your react component using 'reactiveVarConnector' HOC (like
   react-redux's mapStateToProps, mapDispatchToProps method)
2. use directly the dispatch, useReadReactiveVar, and readReactiveVar helper
   functions by the react component.
3. via reactiveVars (see the documentation about
   ["Reactive variables"](https://www.apollographql.com/docs/react/local-state/reactive-variables)
   for more information).
4. via useQuery together with your graphql query (see the documentation about
   ["Querying local state"](https://www.apollographql.com/docs/react/local-state/managing-state-with-field-policies/#querying)
   for more information).

#### METHOD 1. Wrapping your react component using 'reactiveVarConnector' HOC

```js
// for './App'

import store from './store';

// 'reactiveVarConnector' function provides typescript intellisense like react-redux's 'connect' api.
// This means that all of your pre-defined 'selectors' and 'actions' will be provided by typescript
// to your component.
const connect = store.reactiveVarConnector(
  (selectors, ownProps) => {
    return {
      notification: selectors.getNotification,
      message: selectors.getNotificationMessage(ownProps),
    };
  },
  (actions) => ({ setNotificationShow: actions.setNotificationShow }),
);

const App = ({ notification, message, setNotificationShow }) => {
  return (
    <div>
      <p>`Notification: ${notification.message}`</p>
      <p>`Message: ${message}`</p>
      <button onClick={() => setNotificationShow('Hello World!')}>Show Notification</button>;
    </div>
  );
};

export default connect(App);
```

#### OPTION 2. Use directly the dispatch, useReadReactiveVar, and readReactiveVar API

```js
//
import store from './store';

const toastNotificationShow = (message) => {
  // ....your code logic

  // all of the parameters are strongly typed
  // the first parameter is the 'action' to dispatch and the other is the 'payload'
  store.dispatch('setNotificationShow', message);
};

const getNotification = () => {
  // ...your code logic

  // the parameter is the 'selector' name which is strongly typed.
  return store.readReactiveVar('getNotification');
};

// OR
const SampleComponent = () => {
  const message = store.useReadReactiveVar('getNotificationMessage', { userId: 'me' });

  return (
    <div>
      <p>`Message: ${message}`</p>
      <button onClick={() => store.dispatch('setNotificationShow', 'Hello World!')}>Show Notification</button>;
    </div>
  );
};
```

IMPORTANT NOTE: You can still use reactive variables' API provided by
apollo-client

```js
const SampleComponent = () => {
  const { notificationsVar } = store.reactiveVars;
  const notification = notificationsVar();

  return (
    <div>
      <p>`Message: ${notification.message}`</p>
      <button onClick={() => notificationsVar({ isOpen: true, message: 'Hello world!' })}>Show Notification</button>;
    </div>
  );
};
```

For typescript users, see [EXAMPLES](https://github.com/jovenlumaas/apollo-client-reduxify/tree/master/examples).
