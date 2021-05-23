import { useMemo, useReducer, useRef } from "react";
import IgnorablePromise from "@danielkrajnak/ignorable-promise";

type Action<T = string, P = any> = {
  type: T;
  payload: P;
};

export type useAsyncState<T> = {
  isLoading: boolean;
  data: T | null;
  wasSuccessful: boolean;
  hasError: boolean;
  errorMessage: string | null;
};

type InternalState<T> = useAsyncState<T>;

const getErrorMessage = (error: any): string | null => {
  if (typeof error === "string") {
    return error;
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type NotFunction<T> = T extends Function ? never : T;
// Either the payload is a function which expects data and returns data or null,
// or it's just the data, which is not a function.
type EditDataPayload<T> = T extends (data: unknown | null) => unknown | null
  ? T
  : NotFunction<T>;

type StartFetchAction = Action<"START_FETCH">;
type GotDataAction<T> = Action<"GOT_DATA", { response: T }>;
type EditDataAction<T> = Action<"EDIT_DATA", EditDataPayload<T>>;
type ErrorAction = Action<"ERROR", { errorMessage: string | null }>;
type ClearAction = Action<"CLEAR_RESULTS", null>;

type ReducerType<T> = (
  state: InternalState<T>,
  action:
    | StartFetchAction
    | GotDataAction<T>
    | ErrorAction
    | ClearAction
    | EditDataAction<T>
) => InternalState<T>;

const reducer = <T>(
  state: InternalState<T>,
  action:
    | StartFetchAction
    | GotDataAction<T>
    | ErrorAction
    | ClearAction
    | EditDataAction<T>
) => {
  switch (action.type) {
    case "START_FETCH":
      return {
        ...state,
        isLoading: true,
        wasSuccessful: false,
        hasError: false,
        errorMessage: null,
      };
    case "GOT_DATA": {
      return {
        isLoading: false,
        wasSuccessful: true,
        hasError: false,
        errorMessage: null,
        data: action.payload.response,
      };
    }
    case "ERROR": {
      return {
        ...state,
        isLoading: false,
        wasSuccessful: false,
        hasError: true,
        errorMessage: action.payload.errorMessage,
      };
    }
    case "CLEAR_RESULTS": {
      // Reset everything except for isLoading.  Because we can't stop a process, it's better to maintain the fact
      // that we are in a loading state.
      return {
        ...state,
        hasError: false,
        errorMessage: null,
        wasSuccessful: false,
        data: null,
      };
    }

    case "EDIT_DATA": {
      return {
        ...state,
        data:
          typeof action.payload === "function"
            ? action.payload(state.data)
            : action.payload,
      };
    }
    default:
      return state;
  }
};

type Config<T> = {
  initialData?: T | null | undefined;
  genericErrorMessage?: string | null | undefined;
};

export type useAsyncConfig<T> = Config<T>;

export type useAsyncActions<T> = {
  /**
   * Effectively reset everything except for loading.  Sets data to null, resets error and success states
   */
  clear: () => void;
  /**
   * Edit the results returned by the service result.  Warning: This edit will be overridden by future results returned by the service method.
   * and is meant to be used to update a value on the client side to reflect changes that occurred because of the service call.
   */
  edit: (data: T | ((data: T | null) => T | null)) => void;
};

const defaultConfig = {};

/**
 * **Makes it easier to display loading and error states for asynchronous actions.**
 * Pass in a function which returns a promise and this hook will return a tuple of
 * a loading state, which represents the progress of this action, a refresh method, and an object containing additional actions you can take.
 * For more info on that object, look at useAsyncActions.
 * This refresh method accepts the same arguments as the service method.  You can treat it
 * just like the original method, but when called, the loadingState with update appropriately.
 * The clear method will reset the loadingState (except for isLoading as it does not stop a process already in progress).
 *
 * @param {(any) => Promise} serviceMethod
 * @param {Config} config - the config for useAsync.
 */
function useAsync<T, P extends Array<unknown>>(
  serviceMethod: (...args: P) => Promise<T> | null,
  config?: useAsyncConfig<T>
): [useAsyncState<T>, (...args: P) => Promise<T>, useAsyncActions<T>] {
  const safeConfig: Config<T> = useMemo(
    () => ({ ...defaultConfig, ...config }),
    [config]
  );

  const [state, dispatch] = useReducer(reducer as ReducerType<T>, {
    isLoading: false,
    data: safeConfig.initialData || null,
    wasSuccessful: false,
    hasError: false,
    errorMessage: null,
  });

  /*
   * When refresh is called a bunch of times, we want to only pay attention to the most recent call and ignore the results
   * of previously made requests.  We store a method to ignore the last promise in a ref.
   */
  const ignoreLastPromise = useRef(() => {});
  const refresh: (...args: P) => Promise<T> = useMemo(
    () =>
      (...args) => {
        const promise = serviceMethod(...args);
        if (!promise) {
          if (console.error) {
            console.error(new Error("No promise returned by service method"));
          }
          return Promise.reject("No promise returned by service method");
        }
        dispatch({ type: "START_FETCH", payload: null });
        const [ignorablePromise, ignore] = IgnorablePromise(promise);
        // Ignore the last promise.
        ignoreLastPromise.current();
        // Set the ref to ignore this promise.
        ignoreLastPromise.current = ignore;
        // Return the ignorable promise.
        return ignorablePromise
          .then((response) => {
            dispatch({ type: "GOT_DATA", payload: { response } });
            return response;
          })
          .catch((error) => {
            dispatch({
              type: "ERROR",
              payload: {
                errorMessage:
                  getErrorMessage(error) ||
                  safeConfig.genericErrorMessage ||
                  null,
              },
            });
            throw error;
          });
      },
    [safeConfig.genericErrorMessage, serviceMethod]
  );

  const clear = useMemo(
    () => () => {
      dispatch({ type: "CLEAR_RESULTS", payload: null });
    },
    []
  );

  const edit = useMemo(
    () => (update: EditDataPayload<T>) => {
      dispatch({ type: "EDIT_DATA", payload: update });
    },
    []
  );

  return [state, refresh, useMemo(() => ({ clear, edit }), [clear, edit])];
}

export default useAsync;
