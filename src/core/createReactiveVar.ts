import { gql, makeVar, useQuery } from '@apollo/client';
import { saveToStorage, loadFromStorage, makeActionLog } from '../utils';
// types
import type { TReactiveVarOptions, TPersistTo, TReactiveVarsMap } from '../types';

type TReducerContextWithReactiveVars = {
  reactiveVars: TReactiveVarsMap;
  [key: string]: any;
};

type TDevOps = {
  reactiveVars: TReactiveVarsMap;
  enableLog?: boolean | string[];
  context?: Record<string, any>;
};

type TReducerFn<S> = (state: S, payload: any, context: TReducerContextWithReactiveVars) => S;
type TSelectorFn<S> = (state: S, args: any) => any;

type TCreateReactiveVarFn = <
  N extends string,
  S,
  R extends Record<string, TReducerFn<S>>,
  L extends Record<string, TSelectorFn<S>>,
>(options: {
  name: N;
  initialState: S;
  reducers: R;
  selectors?: L;
  persistTo?: TPersistTo;
}) => TReactiveVarOptions<N, S, R, L>;

export const createReactiveVar: TCreateReactiveVarFn = ({ name, initialState, reducers, selectors, persistTo }) => {
  // define reactiveVar instance
  let loadedState = initialState;

  // if persist, load initial data from external storage
  if (persistTo) {
    const loaded = loadFromStorage({ persistTo, name });
    if (loaded) loadedState = loaded;
  }

  // create reactiveVar instance
  const reactiveVar = makeVar(loadedState);

  // **** MAKE REDUCERS
  const variabledReducers = Object.keys(reducers).reduce((acc, key) => {
    return {
      ...acc,
      [key]:
        ({ reactiveVars, enableLog, context }: TDevOps) =>
        (payload: any) => {
          // exclude current reactiveVar key because
          // we don't want to self dispatch thru a case reducer
          const { [name]: nameExcluded, ...otherReactiveVars } = reactiveVars;

          // get state
          const previousState = reactiveVar();
          const updatedState = reducers[key as keyof typeof reducers](previousState, payload, {
            reactiveVars: otherReactiveVars,
            ...(context ?? {}),
          });

          // update reactive variable
          reactiveVar(updatedState);

          // if persist, save data to external storage
          if (persistTo) saveToStorage({ name, persistTo, updatedState });

          // enables logging of the dispatched action from the case reducer
          makeActionLog({ name, key, enableLog, previousState, updatedState });
        },
    };
  }, {} as any);

  let variabledSelectors = {} as any;
  let nonHookSelectors = {} as any;

  // **** MAKE SELECTORS
  if (selectors) {
    Object.keys(selectors).forEach((key) => {
      const caseSelector = selectors[key as keyof typeof selectors];

      // for hook selector
      variabledSelectors[key] = function useVar(args?: any) {
        return caseSelector(useQuery(gql`query reactiveVar_${name} {${name} @client}`)?.data?.[name], args);
      };

      // for non-hook selector
      nonHookSelectors[key] = (args?: any) => caseSelector(reactiveVar(), args);
    });
  }

  // *** RETURN
  return {
    reactiveVars: {
      [name]: reactiveVar,
    } as any,
    fieldTypes: {
      [name]: {
        read: () => reactiveVar(),
      },
    } as any,
    reducers: variabledReducers,
    selectors: variabledSelectors,
    nonHookSelectors,
  };
};
