import type {
  TGenMiddlewareOptions,
  TMiddlewareFn,
  TRunMiddlewareOptions,
  TMergedReactiveVars,
} from "./../types";

function* createMiddlewareGenerator({
  reactiveVars,
  middleware,
  dispatch,
}: TGenMiddlewareOptions) {
  for (let count = 0; count < middleware.length; ) {
    yield middleware[count]({ reactiveVars, dispatch: dispatch([]) });
    count++;
  }
}

export const runMiddleware = ({
  reactiveVars,
  middleware,
  caseReducer,
  type,
  payload,
  dispatch,
}: TRunMiddlewareOptions) => {
  // create generator instance
  const generator = createMiddlewareGenerator({
    reactiveVars,
    middleware,
    dispatch,
  });

  // create middleware recursive next
  const next = () => {
    const { done, value: middleware } = generator.next();

    if (done !== true && middleware) {
      middleware({ type, payload } as any, next);
    } else {
      caseReducer(payload);
    }
  };

  // initialize middleware
  next();
};

/**
 * This function doesn't do anything, this is just for typing purposes when creating middlewares.
 *
 * @param middleware accepts an array of functions (middleware)
 * @returns middleware
 */
export const applyMiddleware = <T extends TMergedReactiveVars<any, any>>(
  ...middleware: TMiddlewareFn<T>[]
) => middleware;
