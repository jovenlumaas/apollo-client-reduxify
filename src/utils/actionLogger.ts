export const makeActionLog = ({
  name,
  key,
  enableLog,
  previousState,
  updatedState,
}: {
  enableLog: any;
  key: string;
  name: string;
  previousState: any;
  updatedState: any;
}) => {
  if (
    enableLog === true ||
    (Array.isArray(enableLog) && enableLog?.includes(name))
  ) {
    const diffKeys = Object.keys(previousState).reduce((acc, key) => {
      if (
        previousState[key as keyof typeof previousState] ===
        updatedState[key as keyof typeof updatedState]
      ) {
        return acc;
      } else {
        return [...acc, key];
      }
    }, [] as string[]);

    // this will log all action dispatched
    console.log(`DISPATCH: ${key}`, {
      reactiveVar: name,
      previousState: getValue(previousState, diffKeys),
      updatedState: getValue(updatedState, diffKeys),
    });
  }
};

// ******************* HELPER FUNCTIONS ********************************* //

const getValue = (obj: any, keys: string[]) =>
  keys.reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});
