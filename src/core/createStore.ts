import type { TMergedReactiveVars } from '../types';

type TDispatchFn<T extends Record<string, any>> = <A extends keyof T>(type: A, ...args: Parameters<T[A]>) => void;

type TGetStateFn<T extends Record<string, any>> = <K extends keyof T>(
  selector: K,
  ...args: Parameters<T[K]>
) => ReturnType<T[K]>;

type TCreateStoreFn = <
  M extends TMergedReactiveVars<any, any>,
  RV = M['reactiveVars'],
  FT = M['fieldTypes'],
  R = M['reducers'],
  S = M['selectors'],
>(
  options: M,
  developerOptions?: {
    enableLog?: boolean | (keyof M['reactiveVars'])[];
    context?: Record<string, any>;
  },
) => {
  reactiveVars: RV;
  fieldTypes: FT;
  selectors: S;
  actions: R;
  dispatch: TDispatchFn<R>;
  useReadReactiveVar: TGetStateFn<S>;
  readReactiveVar: TGetStateFn<S>;
};

export const createReactiveVarStore: TCreateStoreFn = (
  { reactiveVars, fieldTypes, reducers, selectors, nonHookSelectors },
  developerOptions,
) => {
  const { enableLog, context } = developerOptions ?? {};
  const allReducers = Object.keys(reducers).reduce(
    (acc, key) => ({
      ...acc,
      [key]: reducers[key]({ reactiveVars: Object.assign({}, { ...reactiveVars }), enableLog, context }),
    }),
    {} as any,
  );

  return {
    reactiveVars,
    fieldTypes,
    selectors,
    actions: allReducers,
    dispatch: (type, ...args) => {
      allReducers[type as keyof typeof allReducers](args[0]);
    },
    useReadReactiveVar: (selector, ...args) => {
      return selectors[selector as keyof typeof selectors](args[0]);
    },
    readReactiveVar: (selector, ...args) => {
      return nonHookSelectors[selector as keyof typeof nonHookSelectors](args[0]);
    },
  };
};
