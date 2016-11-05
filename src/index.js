import {run} from '@cycle/xstream-run';
import {makeDOMDriver} from '@cycle/dom';
import App from './app';

import locationDriver from './location-driver';

const drivers = {
  DOM: makeDOMDriver('#app'),
  Location: locationDriver
};

run(App, drivers);
