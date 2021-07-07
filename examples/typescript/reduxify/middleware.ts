import { applyMiddleware } from 'apollo-client-reduxify';

import rootVars from './rootVars';

export const middleware = applyMiddleware<typeof rootVars>(
  ({ reactiveVars, dispatch }) =>
    (action, next) => {
      console.log('this is middleware 1');
      if (action.type === 'setModalShow') dispatch('otherAction...', {});
      next();
    },
  () => (action, next) => {
    next();
    console.log('this is middleware 2');
  },
);
