import type { ReactiveVar, FieldFunctionOptions } from "@apollo/client";

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type FunctionMap = Record<string, (...args: any[]) => any>;
export type TReactiveVarsMap = Record<string, ReactiveVar<any>>;
export type TFieldTypeMap = Record<string, TFieldType>;
export type TLegacyDispatchMap = Record<string, (payload?: any) => any>;
export type TLegacySelectorMap = Record<string, (...args: any[]) => any>;

type TFieldType<S = any> = {
  read: (state: S, options: FieldFunctionOptions) => S;
};

export type TSelectors<L extends TLegacySelectorMap> = {
  [P in keyof L]: Parameters<L[P]>[1] extends infer A
    ? A extends never | undefined
      ? () => ReturnType<L[P]>
      : (args: A) => ReturnType<L[P]>
    : never;
};

export type TReactiveVarOptions<
  N extends string = string,
  S = any,
  R extends FunctionMap = FunctionMap,
  L extends FunctionMap = FunctionMap
> = {
  reactiveVars: Record<N, ReactiveVar<S>>;
  fieldTypes: Record<N, TFieldType<S>>;
  reducers: {
    [P in keyof R]: Parameters<R[P]>[1] extends never | undefined
      ? () => void
      : (payload: Parameters<R[P]>[1]) => void;
  };
  selectors: TSelectors<L>;
  nonHookSelectors: TSelectors<L>;
};

export type TReactiveOptionsMap = Record<
  string,
  TReactiveVarOptions | TMergedReactiveVars<any, any>
>;

export type TMergedReactiveVars<
  T extends TReactiveOptionsMap,
  K extends keyof T
> = {
  reactiveVars: UnionToIntersection<T[K]["reactiveVars"]>;
  fieldTypes: UnionToIntersection<T[K]["fieldTypes"]>;
  reducers: UnionToIntersection<T[K]["reducers"]>;
  selectors: UnionToIntersection<T[K]["selectors"]>;
  nonHookSelectors: UnionToIntersection<T[K]["nonHookSelectors"]>;
};

export type TGetStateFn<T extends Record<string, any>> = <K extends keyof T>(
  selector: K,
  ...args: Parameters<T[K]>
) => ReturnType<T[K]>;

export type TDispatchFn<T extends Record<string, any>> = <A extends keyof T>(
  type: A,
  ...args: Parameters<T[A]>
) => void;

export type TInternalDispatchFn = (excludeKeys: string[]) => TDispatchFn<any>;

export type TMiddlewareFn<
  M extends TMergedReactiveVars<any, any>,
  RV = M["reactiveVars"],
  R = M["reducers"],
  A extends keyof R = keyof R
> = (options: {
  reactiveVars: RV;
  dispatch: TDispatchFn<R>;
}) => (action: { type: A; payload: any }, next: () => void) => void;

export type TAllReducers = Record<
  string,
  {
    type: string;
    reducer: (dispatch: TInternalDispatchFn) => (payload: any) => void;
  }
>;

export type TGenMiddlewareOptions = {
  reactiveVars: TReactiveVarsMap;
  middleware: TMiddlewareFn<any>[];
  dispatch: TInternalDispatchFn;
};

export type TRunMiddlewareOptions = TGenMiddlewareOptions & {
  caseReducer: (payload: any) => void;
  type: string;
  payload: any;
};

export type TPersistTo = "sessionStorage";
