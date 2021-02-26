import { ApolloClient, InMemoryCache, HttpLink, from, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from 'apollo-link-context';
import { WebSocketLink } from "@apollo/client/link/ws";
import { RetryLink } from "@apollo/client/link/retry";

export default function createClient({ store } = {}) {
  const authLink = setContext(async (_, { headers }) => {
    const { auth: { token } } = store.getState();
    return {
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${ token }` : '',
      },
    };
  });

  const { meta } = store.getState();

  const httpLink = new HttpLink({
    uri: `${ meta.secure ? 'https' : 'http' }://${ meta.api }/graphql`,
    credentials: 'include',
  });

  let link = from([new RetryLink(), authLink, httpLink]);
  if (!SERVER) {
    // If we're not on server, setup the websocket link too
    const wsLink = new WebSocketLink({
      uri: `${ meta.secure ? 'wss' : 'ws' }://${ meta.api }/graphql`,
      options: {
        reconnect: true,
      },
    });

    link = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink,
    );
  }

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });
}
