import type { TPersistTo } from "../types";

export const saveToSessionStorage = (data: any, storageName: string) => {
  try {
    const stringifiedData = JSON.stringify(data);
    sessionStorage.setItem(storageName, stringifiedData);
  } catch (err) {
    console.log(err);
  }
};

export const loadFromSessionStorage = (storageName: string) => {
  const stringifiedData = sessionStorage?.getItem(storageName);
  try {
    if (stringifiedData === null) {
      return undefined;
    } else {
      if (typeof stringifiedData === "string") {
        return JSON.parse(stringifiedData);
      } else {
        return stringifiedData;
      }
    }
  } catch (err) {
    return undefined;
  }
};

export const loadFromStorage = ({
  name,
  persistTo,
}: {
  persistTo: TPersistTo;
  name: string;
}) => {
  if (name) {
    try {
      switch (persistTo) {
        case "sessionStorage":
          let loaded = loadFromSessionStorage(name);
          if (typeof loaded === "string") loaded = JSON.parse(loaded);

          return loaded;

        default:
          return null;
      }
    } catch (error) {
      return undefined;
    }
  }
};

export const saveToStorage = ({
  persistTo,
  name,
  updatedState,
}: {
  persistTo: TPersistTo;
  name: string;
  updatedState: any;
}) => {
  if (name) {
    try {
      switch (persistTo) {
        case "sessionStorage":
          saveToSessionStorage(JSON.stringify(updatedState), name);
          break;

        default:
          break;
      }
    } catch (error) {
      return undefined;
    }
  }
};
