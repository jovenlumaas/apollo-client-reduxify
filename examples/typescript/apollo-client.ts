import { InMemoryCache, ApolloClient } from '@apollo/client';
import store from './reduxify/store';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        ...store.fieldTypes, // < --- IMPORTANT!!!
        // ...other field policies
      },
    },
  },
});

const client = new ApolloClient({
  cache,
  // ...other options
});

export default client;
