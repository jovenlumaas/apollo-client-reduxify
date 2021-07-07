import store from './reduxify/store';

type Props = {
  userId: string;
};

const SampleComponent = ({ userId }: Props): JSX.Element => {
  const message = store.useReadReactiveVar('getNotificationMessage', { userId });

  return (
    <div>
      <p>`Message: ${message}`</p>
      <button onClick={() => store.dispatch('setNotificationShow', 'Hello World!')}>Show Notification</button>;
    </div>
  );
};

export default SampleComponent;
