// Browser entry point, for Webpack.

import 'regenerator-runtime/runtime';
import 'isomorphic-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import { ModuleRouter, reducers } from 'src/index';
import createNewStore from 'kit/lib/redux';
import { HelmetProvider } from 'react-helmet-async';
import { ApolloProvider } from '@apollo/client';
import createClient from '../lib/apollo';

const { store, history } = createNewStore({
  reducers,
});

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

    const client = createClient({ store });

    return (
      <Provider store={ store }>
        <ConnectedRouter history={ history }>
          <HelmetProvider context={ helmetContext }>
            <ApolloProvider client={ client }>
              <ModuleRouter />
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
