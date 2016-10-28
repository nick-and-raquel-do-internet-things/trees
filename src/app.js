import {h, div, pre, button} from '@cycle/dom';
import xs from 'xstream';

const lSystem = require('./l-system');
import Vector from './vector';

const reducers = {
  GO (state, payload) {
    return {
      ...state,

      system: lSystem(state.system, state.rules)
    };
  }
};

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
    .mapTo({type: 'GO'});

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

    debug(state),

    renderSystem(state)
  ]);
}

function turtleLine (start, end) {
  return (
    h(
      'line',
      {
        attrs: {
          x1: start.x,
          y1: start.y,

          x2: end.x,
          y2: end.y,

          stroke: 'black'
        }
      }
    )
  );
}

const LINE_LENGTH = 15;

function project (origin, degrees, length) {
  const angle = degrees * (Math.PI / 180);

  return Vector({
    x: origin.x * Math.cos(angle) - origin.y * Math.sin(angle),
    y: origin.x * Math.sin(angle) + origin.y * Math.cos(angle)
  });
}

function turtleItUp (turtleState, character, index, characters) {
  if (character === '0' || character === '1') {
    const lineEndPosition = turtleState.position.plus(
      project(
        {
          x: LINE_LENGTH / Math.log(characters.length / 2),
          y: 0
        },
        turtleState.direction
      )
    );

    return {
      ...turtleState,

      position: lineEndPosition,

      lines: [...turtleState.lines, turtleLine(turtleState.position, lineEndPosition)]
    };
  }

  if (character === '[') {
    return {
      ...turtleState,

      positions: [
        ...turtleState.positions,

        {position: turtleState.position, direction: turtleState.direction}
      ],

      direction: turtleState.direction + 45
    };
  }

  if (character === ']') {
    const poppedPosition = turtleState.positions[turtleState.positions.length - 1];

    return {
      ...turtleState,

      position: poppedPosition.position,
      direction: poppedPosition.direction - 45,

      positions: turtleState.positions.slice(0, -1)
    };
  }
}

function renderSystem (state) {
  const turtleState = {
    position: Vector({
      x: innerWidth / 2,
      y: 600
    }),

    direction: 270,

    positions: [
    ],

    lines: []
  };

  return (
    h('svg', {attrs: {width: innerWidth, height: '100vh'}}, [
      ...state.system.split('').reduce(turtleItUp, turtleState).lines
    ])
  );
}

function debug (val) {
  return pre(JSON.stringify(val, null, 2));
}

export default App;
