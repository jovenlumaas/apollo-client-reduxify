import { gql, makeVar, useQuery } from "@apollo/client";
import { saveToStorage, loadFromStorage, makeActionLog } from "../utils";
// types
import type {
  TReactiveVarOptions,
  TPersistTo,
  TReactiveVarsMap,
  TSelectors,
  TInternalDispatchFn,
} from "../types";

type TReducerContextWithReactiveVars = {
  reactiveVars: TReactiveVarsMap;
  [key: string]: any;
};

type TDevOps = {
  reactiveVars: TReactiveVarsMap;
  nonHookSelectors: TSelectors<any>;
  enableLog?: boolean | string[];
  context?: Record<string, any>;
};

type TReducerFn<S> = (
  state: S,
  payload: any,
  context: TReducerContextWithReactiveVars
) => S;
type TSelectorFn<S> = (state: S, args: any) => any;

type TCreateReactiveVarFn = <
  N extends string,
  S,
  R extends Record<string, TReducerFn<S>>,
  L extends Record<string, TSelectorFn<S>>
>(options: {
  name: N;
  initialState: S;
  reducers: R;
  selectors?: L;
  persistTo?: TPersistTo;
}) => TReactiveVarOptions<N, S, R, L>;

/**
 * Creates reactive variable instance and reduxify methods such as reducers and selectors
 *
 * @param name the name of the reactive variable. By convention, suffix it with 'Var' keyword to that it is easily to distinguish from the other apollo-client's reactive varaible instances and field policies.
 * @param initialState initializes the value of the reactive variable.
 * @param reducers an object of functions (or actions) for the reactive variable state to mutate (update) that accepts three parameters. The first parameter is the previous state, the second parameter is the payload
 * of the action and the third parameter is the context (by default includes all reactive variable instances, dispatch function, and selectors, while other meta-data are supplied by during creation of reactive variable store using 'createReactiveVarStore' function.)
 * @param selectors an object of functions used for selecting a particular value within the reactive variable state.
 *
 * @param persistTo a string to explicitly state which storage location the reactive variable state to persist.
 *
 * @returns an object of metadata to be used in apollo-client reactive variable methods.
 */
export const createReactiveVar: TCreateReactiveVarFn = ({
  name,
  initialState,
  reducers,
  selectors,
  persistTo,
}) => {
  // evaluate initial value (either from intialState or from external storage)
  let loadedState = initialState;

  // if persist, load initial data from the external storage
  if (persistTo) {
    const loaded = loadFromStorage({ persistTo, name });
    if (loaded) loadedState = loaded;
  }

  // create reactiveVar instance
  const reactiveVar = makeVar(loadedState);

  // **** CREATE REDUCERS
  const variabledReducers = Object.keys(reducers).reduce((acc, key) => {
    return {
      ...acc,
      [key]:
        ({ reactiveVars, nonHookSelectors, enableLog, context }: TDevOps) =>
        (dispatch: TInternalDispatchFn) =>
        (payload: any) => {
          // exclude current reactiveVar key because
          // we don't want to self dispatch thru a case reducer
          const { [name]: nameExcluded, ...otherReactiveVars } = reactiveVars;

          // exclude current selectors
          // we don't want to dispatch an action within the same reactive variable
          const currentSelectorsKeys = Object.keys(selectors ?? {});
          const otherSelectors = Object.keys(nonHookSelectors)
            .filter((key) => !currentSelectorsKeys.includes(key))
            .reduce(
              (acc, key) => ({ ...acc, [key]: nonHookSelectors[key] }),
              {}
            );

          // get the reactiveVar state
          const previousState = reactiveVar();
          const updatedState = reducers[key as keyof typeof reducers](
            previousState,
            payload,
            {
              // pass all the default and user-defined contexts to the case reducer
              reactiveVars: otherReactiveVars,
              nonHookSelectors: otherSelectors,
              dispatch: dispatch(Object.keys(reducers)),
              ...(context ?? {}),
            }
          );

          // update reactive variable state
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

  // **** CREATE SELECTORS
  if (selectors) {
    Object.keys(selectors).forEach((key) => {
      const caseSelector = selectors[key as keyof typeof selectors];

      // for hook selector
      variabledSelectors[key] = function useVar(args?: any) {
        return caseSelector(
          useQuery(gql`query reactiveVar_${name} {${name} @client}`)?.data?.[
            name
          ],
          args
        );
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
