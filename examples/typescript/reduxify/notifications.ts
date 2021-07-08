import { createReactiveVar } from 'apollo-client-reduxify';

interface INotification {
  isOpen: boolean;
  message: string;
}

const initialState: INotification = {
  isOpen: false,
  message: '',
};

export const notificationsVar = createReactiveVar({
  name: 'notificationsVar',
  initialState,
  reducers: {
    setNotificationShow: (state, payload: string) => ({
      ...state,
      isOpen: true,
      message: payload,
    }),
    setNotificationHide: () => initialState,
  },
  selectors: {
    getNotification: (s) => s,
    getNotificationMessage: (s, props: { userId: string }) => {
      if (props.userId === 'me') {
        return null;
      } else {
        return s.message;
      }
    },
  },
});
