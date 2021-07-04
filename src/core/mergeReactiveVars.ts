import type { TMergedReactiveVars, TReactiveOptionsMap } from "../types";

type TMergeReactiveVarsFn = <T extends TReactiveOptionsMap, K extends keyof T>(
  allInstances: T
) => TMergedReactiveVars<T, K>;

export const mergeReactiveVars: TMergeReactiveVarsFn = (allInstances) => {
  return Object.keys(allInstances).reduce(
    (acc, key) => {
      const {
        reactiveVars,
        fieldTypes,
        reducers: instanceReducers,
        selectors,
        nonHookSelectors,
      } = allInstances[key as keyof typeof allInstances];
      return {
        reactiveVars: {
          ...acc.reactiveVars,
          ...(reactiveVars ?? {}),
        },
        fieldTypes: {
          ...acc.fieldTypes,
          ...(fieldTypes ?? {}),
        },
        reducers: {
          ...acc.reducers,
          ...instanceReducers,
        },
        selectors: {
          ...acc.selectors,
          ...selectors,
        },
        nonHookSelectors: {
          ...acc.nonHookSelectors,
          ...nonHookSelectors,
        },
      };
    },
    {
      reactiveVars: {},
      fieldTypes: {},
      reducers: {},
      selectors: {},
      nonHookSelectors: {},
    } as any
  );
};
