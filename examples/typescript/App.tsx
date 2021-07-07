import { ConnectedProps } from 'apollo-client-reduxify';
import store from './reduxify/store';

interface OwnProps {
  userId: string;
}

type Props = ConnectedProps<typeof connect> & OwnProps;

// 'reactiveVarConnector' function provides typescript intellisense like react-redux's 'connect' api.
// This means that all of your pre-defined 'selectors' and 'actions' will be provided by typescript
// to your component.
const connect = store.reactiveVarConnector(
  (selectors, ownProps: OwnProps) => {
    return {
      notification: selectors.getNotification,
      message: selectors.getNotificationMessage(ownProps),
    };
  },
  (actions) => ({ setNotificationShow: actions.setNotificationShow }),
);

const App = ({ notification, message, setNotificationShow }: Props): JSX.Element => {
  return (
    <div>
      <p>`Notification: ${notification.message}`</p>
      <p>`Message: ${message}`</p>
      <button onClick={() => setNotificationShow('Hello World!')}>Show Notification</button>;
    </div>
  );
};

export default connect(App);
