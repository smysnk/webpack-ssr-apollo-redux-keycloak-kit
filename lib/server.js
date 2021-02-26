/* eslint-disable no-param-reassign, no-console */

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { PassThrough } from 'stream';
import http from 'http';
import 'isomorphic-fetch';
import React from 'react';
import Koa from 'koa';
import { Provider } from 'react-redux';
import { renderToString, renderToNodeStream } from 'react-dom/server';

import koaCors from '@koa/cors';
import koaSend from 'koa-send';
import KoaRouter from '@koa/router';
import ms from 'microseconds';

import { ConnectedRouter } from 'connected-react-router';
import { HelmetProvider } from 'react-helmet-async';
import { ServerStyleSheets } from '@material-ui/core/styles';
import { ApolloProvider } from '@apollo/client';

import { ModuleRouter, reducers } from 'src/index';
import Html from '../views/ssr';
import createClient from './apollo';
import config from '../config';
import PATHS from '../../config/paths';
import createNewStore from './redux';


export function staticMiddleware() {
  return async function staticMiddlewareHandler(ctx, next) {
    try {
      if (ctx.path !== '/') {
        return await koaSend(
          ctx,
          ctx.path,
          {
            root: PATHS.public,
          },
        );
      }
    } catch (e) { /* Errors will fall through */ }
    return next();
  };
}


export function createReactHandler(css = '', scripts = [], chunkManifest = {}) {
  return async function reactHandler(ctx) {
    const helmetContext = {};
    const routeContext = {};
    const sheets = new ServerStyleSheets();

    const client = createClient({ store: ctx.store });

    const components = (
      sheets.collect(
        <Provider store={ ctx.store }>
          <ConnectedRouter history={ ctx.history }>
            <HelmetProvider context={ helmetContext }>
              <ApolloProvider client={ client }>
                <ModuleRouter />
              </ApolloProvider>
            </HelmetProvider>
          </ConnectedRouter>
        </Provider>,
      )
    );
    const html = renderToString(components);
    const cssInline = sheets.toString();


    // Handle redirects
    if ([301, 302].includes(routeContext.status)) {
      // 301 = permanent redirect, 302 = temporary
      ctx.status = routeContext.status;
      ctx.redirect(routeContext.url);
      return;
    }

    if (routeContext.status === 404) {
      if (config.handler404) {
        config.handler404(ctx);
        return;
      }

      ctx.status = routeContext.status;
    }

    const htmlStream = new PassThrough();
    htmlStream.write('<!DOCTYPE html>');

    // console.log(cssInline);

    // Create a stream of the React render. We'll pass in the
    // Helmet component to generate the <head> tag, as well as our Redux
    // store state so that the browser can continue from the server
    const reactStream = renderToNodeStream(
      <Html
        helmet={ helmetContext.helmet }
        window={{
          webpackManifest: chunkManifest,
          __STATE__: ctx.store.getState(),
        }}
        css={ css }
        cssInline={ cssInline }
        scripts={ scripts }
      >
        <div id="main" dangerouslySetInnerHTML={{ __html: html }} />
      </Html>,
    );

    reactStream.pipe(htmlStream);
    ctx.type = 'text/html';
    ctx.body = htmlStream;
  };
}

const router = (new KoaRouter())
  // Set-up a general purpose /ping route to check the server is alive
  .get('/ping', async ctx => {
    ctx.body = 'pong';
  })

  // Favicon.ico.  By default, we'll serve this as a 204 No Content.
  // If /favicon.ico is available as a static file, it'll try that first
  .get('/favicon.ico', async ctx => {
    ctx.status = 204;
  });

// Build the app instance, which we'll use to define middleware for Koa
// as a precursor to handling routes
const app = new Koa()
  // .use(koaCors(config.corsOptions))

  // Error wrapper.  If an error manages to slip through the middleware
  // chain, it will be caught and logged back here
  .use(async (ctx, next) => {
    try {
      await next();
    } catch (e) {
      // If we have a custom error handler, use that - else simply log a
      // message and return one to the user
      if (typeof config.errorHandler === 'function') {
        config.errorHandler(e, ctx, next);
      } else {
        console.log('Error:', e);
        ctx.body = 'There was an error. Please try again later.';
      }
    }
  });

if (config.enableTiming) {
  // It's useful to see how long a request takes to respond.  Add the
  // timing to a HTTP Response header
  app.use(async (ctx, next) => {
    const start = ms.now();
    await next();
    const end = ms.parse(ms.since(start));
    const total = end.microseconds + (end.milliseconds * 1e3) + (end.seconds * 1e6);
    ctx.set('Response-Time', `${ total / 1e3 }ms`);
  });
}

// Middleware to set the per-request environment, including the Apollo client.
// These can be overriden/added to in userland with `config.addBeforeMiddleware()`
app.use(async (ctx, next) => {
  ctx.apollo = {};
  return next();
});

// Add 'before' middleware that needs to be invoked before the per-request
// Apollo client and Redux store has instantiated
// config.beforeMiddleware.forEach(middlewareFunc => app.use(middlewareFunc));

// Create a new Apollo client and Redux store per request.  This will be
// stored on the `ctx` object, making it available for the React handler or
// any subsequent route/middleware
app.use(async (ctx, next) => {
  if (!ctx.store || !ctx.history) {
    const { store, history } = createNewStore({
      currentUrl: ctx.request.url,
      reducers,
    });
    ctx.store = store;
    ctx.history = history;
  }

  // Create a new server Apollo client for this request, if we don't already
  // have one
  if (!ctx.apollo.client) {
    ctx.apollo.client = createClient({
      store: ctx.store,
    });
  }

  return next();
});

const listen = () => {
  const servers = [];
  servers.push(
    http.createServer(app.callback()).listen(process.env.PORT || 3000),
  );

  return servers;
};

export default {
  router,
  app,
  listen,
};
