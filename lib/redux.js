import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory, createMemoryHistory } from 'history';

import { reducer as formReducer } from 'redux-form';

// Detect if we're both in the browser, AND we have dehydrated state
const hasState = !!(!SERVER && window.__STATE__);

const metaReducer = (state = {}, action) =>
  // const newState = Object.assign({}, state, {
  //   toggle: !state.toggle,
  // });
  state;


export default function createNewStore({ currentUrl, reducers, states }) {
  const preState = {
    meta: {
      api: SERVER ? process.env.API_ENDPOINT : API_ENDPOINT,
      secure: SERVER ? process.env.API_SECURE === 'true' : API_SECURE === 'true',
      version: VERSION, // These are hardwired into the build
      sha: SHA, // These are hardwired into the build
      frontendUrl: SERVER ? process.env.FRONTEND_URL : FRONTEND_URL,
      keycloakRealmName: SERVER ? process.env.KEYCLOAK_REALM_NAME : KEYCLOAK_REALM_NAME,
      keycloakAuthServerUrl: SERVER ? process.env.KEYCLOAK_AUTH_SERVER_URL : KEYCLOAK_AUTH_SERVER_URL,
      keycloakClientId: SERVER ? process.env.KEYCLOAK_CLIENT_ID : KEYCLOAK_CLIENT_ID,
      keycloakOnLoad: SERVER ? process.env.KEYCLOAK_ON_LOAD : KEYCLOAK_ON_LOAD,
    },
    ...states,
  };

  const state = (SERVER || (!SERVER && !window.__STATE__)) ? preState : window.__STATE__;
  // Create a history depending on the environment
  const history = SERVER
    ? createMemoryHistory({
      initialEntries: [currentUrl],
    })
    : createBrowserHistory();

  const rootReducer = combineReducers({
    router: connectRouter(history),
    form: formReducer,
    meta: metaReducer,
    ...reducers,
  });

  const store = createStore(
    rootReducer,
    state,
    compose(
      applyMiddleware(
        routerMiddleware(history),
      ),
      // Enable Redux Devtools on the browser, for easy state debugging
      // eslint-disable-next-line no-underscore-dangle
      (!SERVER && typeof window.__REDUX_DEVTOOLS_EXTENSION__ !== 'undefined') ? window.__REDUX_DEVTOOLS_EXTENSION__() : f => f,
    ),
  );

  return { store, history };
}
