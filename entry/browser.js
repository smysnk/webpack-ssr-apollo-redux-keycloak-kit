// Browser entry point, for Webpack.

import 'regenerator-runtime/runtime';
import 'isomorphic-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import { ModuleRouter, reducers, keycloakInit } from 'src/index';
import createNewStore from 'kit/lib/redux';
import { HelmetProvider } from 'react-helmet-async';
import { ApolloProvider, gql } from '@apollo/client';
import { KeycloakProvider } from 'use-keycloak';
import createApolloClient from '../lib/apollo';

// Create the 'root' entry point into the app.  If we have React hot loading
// (i.e. if we're in development), then we'll wrap the whole thing in an
// <AppContainer>.  Otherwise, we'll jump straight to the browser router
function doRender() {
  const renderMethod = module.hot ? ReactDOM.render : ReactDOM.hydrate;
  renderMethod(
    <Root />,
    document.getElementById('main'),
  );
}

const Root = (() => {
  const Chain = () => {
    const helmetContext = {};
    React.useEffect(() => {
      const jssStyles = document.querySelector('#jss-server-side');
      if (jssStyles) {
        jssStyles.parentElement.removeChild(jssStyles);
      }
    }, []);

    let key = null;
    let record = [];
    const middleware = [];

    // Redux Replay
    const recordMiddleware = ({ dispatch, getState }) => (next) => async (action) => {
      const { meta } = getState();
      if (meta.recordState) {
        record.push([new Date(), action]);
      }
      return next(action);
    };
    middleware.push(recordMiddleware);

    const { store, history } = createNewStore({
      reducers,
      middleware,
    });
    const { meta } = store.getState();
    const client = createApolloClient(store);
    const keycloak = keycloakInit(store);

    if (meta.recordState) {
      (async () => {
        const { data: { stateRecordStart: { id, error } } } = await client
          .mutate({
            mutation: gql`
              mutation RecordStateStart($host: String!, $timestamp: String!, $payload: String!) {
                stateRecordStart(host: $host, timestamp: $timestamp, payload: $payload) {
                  id
                  error
                }
              }
            `,
            variables: {
              host: window.location.host,
              timestamp: new Date(),
              payload: JSON.stringify(store.getState()),
            },
          });
        if (!error && id) {
          key = id;
        }
      })();

      // Report state to api
      setInterval(async () => {     
        if (record.length === 0 || !key) {
          return;
        } 
        const { data: { stateRecord: { error, message } } } = await client
          .mutate({
            mutation: gql`
              mutation RecordState($key: Int!, $payload: String!) {
                stateRecord(key: $key, payload: $payload) {
                  error
                  message
                }
              }
            `,
            variables: {
              key,
              payload: JSON.stringify(record),
            },
          });
        if (error === false) {
          record = [];
        }
      }, 5000);
    }

    return (
      <Provider store={ store }>
        <ConnectedRouter history={ history }>
          <HelmetProvider context={ helmetContext }>
            <ApolloProvider client={ client }>
              <KeycloakProvider keycloak={ keycloak }>
                <ModuleRouter />
              </KeycloakProvider>
            </ApolloProvider>
          </HelmetProvider>
        </ConnectedRouter>
      </Provider>
    );
  };

  if (module.hot) {
    module.hot.accept('src/index', () => {
      // eslint-disable-next-line
      require('src/index').default;
      doRender();
    });

    return () => (
      <Chain />
    );
  }

  return Chain;
})();

doRender();
