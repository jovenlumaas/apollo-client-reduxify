import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from '@apollo/client';
import client from './apollo-client';

import App from './App';
import SampleComponent from './SampleComponent';

ReactDOM.render(
  <React.Fragment>
    <ApolloProvider client={client}>
      <App userId="me" />
      <SampleComponent userId="me" />
    </ApolloProvider>
  </React.Fragment>, // or React.StrictMode
  document.getElementById('root'),
);
