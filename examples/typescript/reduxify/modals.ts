import { createReactiveVar } from 'apollo-client-reduxify';

interface IModal {
  isOpen: boolean;
  promptMessage: string;
}

const initialState: IModal = {
  isOpen: false,
  promptMessage: '',
};

export const modalsVar = createReactiveVar({
  name: 'modalsVar',
  // you have the option to persist a particular state, while keeping others not to persist.
  persistTo: 'sessionStorage',
  initialState,
  reducers: {
    // you can access other reactive variable state or even dispatch an action via 'context' argument.
    // 'context' includes default API such as 'dispatch','reactiveVars', and 'nonHookSelectors'.
    // the developer can add metadata to this context during 'store' creation under context option
    setModalShow: (state, payload, context) => {
      const { reactiveVars, logger } = context;
      const notificationsState = reactiveVars.notificationsVar();

      // ... your code logic using 'notificationsState'

      logger("dispatched action: 'setModalShow'");

      return {
        ...state,
        isOpen: true,
        promptMessage: payload,
      };
    },
    setModalHide: () => initialState,
  },
  selectors: {
    getModal: (s) => s,
  },
});
