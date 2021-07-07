import { runMiddleware } from "./middleware";
import {
  createReactiveVarConnector,
  IReactiveVarConnectorFn,
} from "./components/connector";
import type {
  TMergedReactiveVars,
  TGetStateFn,
  TDispatchFn,
  TMiddlewareFn,
  TAllReducers,
} from "./../types";

type TCreateStoreFn = <
  M extends TMergedReactiveVars<any, any>,
  RV = M["reactiveVars"],
  FT = M["fieldTypes"],
  R = M["reducers"],
  S = M["selectors"]
>(
  rootReactiveVar: M,
  developerOptions?: {
    enableLog?: boolean | (keyof M["reactiveVars"])[];
    context?: Record<string, any>;
  },
  middleware?: TMiddlewareFn<M>[]
) => {
  reactiveVars: RV;
  fieldTypes: FT;
  dispatch: TDispatchFn<R>;
  useReadReactiveVar: TGetStateFn<S>;
  readReactiveVar: TGetStateFn<S>;
  reactiveVarConnector: IReactiveVarConnectorFn<S, R>;
};

/**
 * Compiles all the reactive variables's state and generates utility functions, and methods necessary for apollo-client's reactive state management.
 *
 * @param rootReactiveVar an object of all merged reactive variables and reduxify methods (reactiveVars, reducers, selectors, fieldTypes, ..etc)
 * @param developerOptions a configuration for the developer to observe, includes logging of the dispatched actions, other metadata to be passed in the context of all reducers.
 * @param middleware a middleware that accepts an array of functions where all of the dispatched actions, before to invoke, will be evaluated sequentially. Use 'applyMiddleware' helper function as a wrapper.
 *
 * @returns a store that includes utility functions, and methods necessary for apollo-client's reactive state management.
 */
export const createReactiveVarStore: TCreateStoreFn = (
  { reactiveVars, fieldTypes, reducers, selectors, nonHookSelectors },
  developerOptions,
  middleware
) => {
  const { enableLog, context } = developerOptions ?? {};
  const allReducers = Object.keys(reducers).reduce(
    (acc, key) => ({
      ...acc,
      [key]: {
        type: key,
        reducer: reducers[key]({
          reactiveVars: Object.assign({}, { ...reactiveVars }),
          nonHookSelectors: Object.assign({}, { ...nonHookSelectors }),
          enableLog,
          context,
        }),
      },
    }),
    {} as TAllReducers
  );

  const dispatch =
    (excludeKeys: string[]) =>
    (type: any, ...args: any[]) => {
      if (excludeKeys.includes(type)) {
        throw new TypeError(
          `Dispatch action with key '${type}' is within the same reactive variable and is not allowed to be invoked inside the case reducer.`
        );
      } else {
        const actionToDispatch = allReducers[type as keyof typeof allReducers];

        if (actionToDispatch) {
          const caseReducer = actionToDispatch.reducer(dispatch);

          // apply middleware
          if (middleware && middleware.length > 0) {
            runMiddleware({
              reactiveVars,
              middleware,
              caseReducer,
              type,
              payload: args[0],
              dispatch,
            });
          } else {
            caseReducer(args[0]);
          }
        } else {
          throw new TypeError(
            `The dispatched action with key '${type}' doesn't exist or a case reducer is undefined.`
          );
        }
      }
    };

  return {
    reactiveVars,
    fieldTypes,
    dispatch: dispatch([]),
    useReadReactiveVar: (selector, ...args) => {
      return selectors[selector as keyof typeof selectors](args[0]);
    },
    readReactiveVar: (selector, ...args) => {
      return nonHookSelectors[selector as keyof typeof nonHookSelectors](
        args[0]
      );
    },
    reactiveVarConnector: createReactiveVarConnector(
      selectors,
      allReducers,
      dispatch
    ),
  };
};
