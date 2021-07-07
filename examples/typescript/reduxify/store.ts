import { createReactiveVarStore } from 'apollo-client-reduxify';

import rootVars from './rootVars';
import { middleware } from './middleware';

const store = createReactiveVarStore(rootVars, {
  enableLog: true, // or ["modalsVar", ...etc] if you want to log a particular state only
  context: {
    // ... you can provide an additional context here to access by all reducers
    // for a logic or running a function purposes. We add a logger in this case.
    logger(value: string) {
      console.log(value);
    },
  },
  middleware, // you can add an optional middleware
});

export default store;
