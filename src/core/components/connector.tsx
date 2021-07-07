import React from "react";
import type {
  TAllReducers,
  TSelectors,
  TInternalDispatchFn,
} from "../../types";

type MapStateCallback<S> = (allSelectors: S, ownProps?: any) => any;
type MapDispatchCallback<A> = (actions: A) => any;
type MapSelectorReturnType<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => infer R ? R : T[P];
};

type InferableComponentWithProps<TInjectedProps = any, TNeedsProps = any> = <
  C extends React.ComponentType<TInjectedProps & TNeedsProps>
>(
  component: C
) => (props: TNeedsProps) => JSX.Element;

export interface IReactiveVarConnectorFn<S, A> {
  /**
   * ReactiveVarConnector 'mapState' and 'mapDispatch' overload.
   *
   * This overload maps the selected state and action to the react component with typescript intellisense.
   */
  <MS extends MapStateCallback<S>, MD extends MapDispatchCallback<A>>(
    mapState: MS,
    mapDispatch: MD
  ): InferableComponentWithProps<
    MapSelectorReturnType<ReturnType<MS>> & ReturnType<MD>,
    any
  >;

  /**
   * ReactiveVarConnector 'mapState' overload.
   *
   * This overload maps the selected state to the react component with typescript intellisense.
   */
  <MS extends MapStateCallback<S>>(
    mapState: MS,
    mapDispatch?: null | undefined
  ): InferableComponentWithProps<MapSelectorReturnType<ReturnType<MS>>>;

  /**
   * ReactiveVarConnector 'mapDispatch' overload.
   *
   * This overload maps the selected action to the react component with typescript intellisense.
   */
  <MD extends MapDispatchCallback<A>>(
    mapState: null | undefined,
    mapDispatch: MD
  ): InferableComponentWithProps<ReturnType<MD>>;
}

const handleMapState = ({
  mapState,
  selectors,
  ownProps,
}: {
  mapState?: Function | null;
  selectors: TSelectors<any>;
  ownProps: any;
}) => {
  if (mapState) {
    const mappedState = mapState(selectors, ownProps);

    return Object.keys(mappedState).reduce((acc, key) => {
      const mapStateInstance = mappedState[key];
      return {
        ...acc,
        [key]:
          typeof mapStateInstance === "function"
            ? mapStateInstance()
            : mapStateInstance,
      };
    }, {});
  } else {
    return {};
  }
};

const handleMapDispatch = ({
  mapDispatch,
  allReducers,
  dispatch,
}: {
  mapDispatch?: Function | null;
  allReducers: TAllReducers;
  dispatch: TInternalDispatchFn;
}) => {
  if (mapDispatch) {
    const selectedReducers = mapDispatch(allReducers);
    return Object.keys(selectedReducers).reduce((acc, key) => {
      return {
        ...acc,
        [key]: (payload: any) => {
          dispatch([])(selectedReducers[key].type, payload);
        },
      };
    }, {});
  } else {
    return {};
  }
};

export const createReactiveVarConnector =
  <S extends TSelectors<any>, A extends TAllReducers>(
    selectors: S,
    allReducers: A,
    dispatch: TInternalDispatchFn
  ): IReactiveVarConnectorFn<S, A> =>
  (mapState: any, mapDispatch?: any) =>
  (WrappedComponent: any) =>
  (ownProps: any) => {
    return (
      <WrappedComponent
        {...handleMapState({ mapState, selectors, ownProps })}
        {...handleMapDispatch({ mapDispatch, allReducers, dispatch })}
        {...ownProps}
      />
    );
  };

export type ConnectedProps<TConnector> =
  TConnector extends InferableComponentWithProps<infer TInjectedProps, any>
    ? unknown extends TInjectedProps
      ? TConnector extends InferableComponentWithProps<infer TInjectedProps>
        ? TInjectedProps
        : never
      : TInjectedProps
    : never;
