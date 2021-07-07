import { mergeReactiveVars } from 'apollo-client-reduxify';

import { notificationsVar } from './notifications';
import { modalsVar } from './modals';

export default mergeReactiveVars({
  notificationsVar,
  modalsVar,
});
