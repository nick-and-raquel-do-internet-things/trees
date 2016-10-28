import {div, pre, button} from '@cycle/dom';
import xs from 'xstream';

const lSystem = require('./l-system');

const reducers = {
  GO (state, payload) {
    return {
      ...state,

      system: lSystem(state.system, state.rules)
    }
  }
}

function App (sources) {
  const initialState = {
    system: '0',

    rules: {
      '1': '11',
      '0': '1[0]0'
    }
  };

  const goAction$ = sources
    .DOM
    .select('.go')
    .events('click')
    .mapTo({type: 'GO'})

  const action$ = xs.merge(
    goAction$
  );

  const state$ = action$.fold((state, action) => {
    const reducer = reducers[action.type];

    if (!reducer) {
      throw new Error(`Implement a reducer for action type "${action.type}"`);
    }

    return reducer(state, action.payload);
  }, initialState);

  return {
    DOM: state$.map(view)
  };
}

function view (state) {
  return div([
    button('.go', 'GO!'),

    debug(state)
  ]);
}

function debug (val) {
  return pre(JSON.stringify(val, null, 2));
}

export default App;
