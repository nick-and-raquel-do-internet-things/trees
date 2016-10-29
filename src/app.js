import {h, div, pre, button} from '@cycle/dom';
import xs from 'xstream';

const lSystem = require('./l-system');
import Vector from './vector';
import Instructions from './instructions';

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

  const instructions = Instructions(sources);

  return {
    DOM: xs.combine(state$, instructions.DOM, instructions.state$).map(view)
  };
}

function view ([state, instructionsDOM, instructionsState]) {
  return div([
    button('.go', 'GO!'),

    instructionsDOM,

    debug(state),

    renderSystem(state, instructionsState)
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

function project (origin, degrees, length) {
  const angle = degrees * (Math.PI / 180);

  return Vector({
    x: origin.x * Math.cos(angle) - origin.y * Math.sin(angle),
    y: origin.x * Math.sin(angle) + origin.y * Math.cos(angle)
  });
}

const turtleReducers = {
  GO_FORWARD (turtleState, distance) {
    const lineEndPosition = turtleState.position.plus(
      project(
        {
          x: parseInt(distance, 10),
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
  },

  TURN_LEFT (turtleState, degrees) {
    return {
      ...turtleState,

      direction: turtleState.direction + parseInt(degrees, 10)
    };
  },

  TURN_RIGHT (turtleState, degrees) {
    return {
      ...turtleState,

      direction: turtleState.direction - parseInt(degrees, 10)
    };
  },

  SAVE (turtleState) {
    return {
      ...turtleState,

      positions: [
        ...turtleState.positions,

        {position: turtleState.position, direction: turtleState.direction}
      ]
    };
  },

  LOAD (turtleState) {
    const poppedPosition = turtleState.positions[turtleState.positions.length - 1];

    return {
      ...turtleState,

      direction: poppedPosition.direction,
      position: poppedPosition.position,

      positions: turtleState.positions.slice(0, -1)
    };
  }
};

function turtleItUp (instructionsState, turtleState, character, index, characters) {
  const instructions = instructionsState[character];

  if (!instructions || instructions.length === 0) {
    console.log(`no instruction found for "${character}"`);
    return turtleState;
  }

  instructions.forEach(instruction => {
    const turtleReducerForInstruction = turtleReducers[instruction.type];

    if (!turtleReducerForInstruction) {
      throw new Error(`Please implement a turtle reducer for ${instruction.type}`);
    }

    turtleState = turtleReducerForInstruction(turtleState, ...instruction.args.map(arg => arg.value));
  });

  return turtleState;
}

function renderSystem (state, instructionsState) {
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
      ...state.system.split('').reduce((acc, character, index, characters) => turtleItUp(instructionsState, acc, character, index, characters), turtleState).lines
    ])
  );
}

function debug (val) {
  return pre(JSON.stringify(val, null, 2));
}

export default App;
