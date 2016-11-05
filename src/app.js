import {h, div, pre, button} from '@cycle/dom';
import xs from 'xstream';
import SvgPanAndZoom from 'cycle-svg-pan-and-zoom';

const lSystem = require('./l-system');
import Vector from './vector';
import Instructions from './instructions';
import Controls from './controls';

const reducers = {
  GO (state, payload) {
    return {
      ...state,

      system: lSystem(state.system, state.rules)
    };
  },

  UPDATE_STATE_FROM_CONTROLS (state, payload) {
    return {
      ...state,

      system: payload.axiom,
      axiom: payload.axiom,

      rules: payload.rules
    };
  }
};

function App ({DOM, Location}) {
  const initialState = {
    system: '',
    axiom: '',

    rules: {
    }
  };

  const controlsProps$ = Location.map(location => location.controlsState);

  const controls = Controls({DOM, props$: controlsProps$});

  const goAction$ = DOM
    .select('.go')
    .events('click')
    .mapTo({type: 'GO'});

  const updateStateFromControls$ = controls
    .state$
    .map(state => ({type: 'UPDATE_STATE_FROM_CONTROLS', payload: state}));

  const action$ = xs.merge(
    goAction$,

    updateStateFromControls$
  );

  const state$ = action$.fold((state, action) => {
    const reducer = reducers[action.type];

    if (!reducer) {
      throw new Error(`Implement a reducer for action type "${action.type}"`);
    }

    return reducer(state, action.payload);
  }, initialState);

  const instructionsProps$ = Location.map(location => location.instructionsState);

  const instructions = Instructions({DOM, props$: instructionsProps$, newCharacter$: controls.newCharacter$});

  const allTheState$ = xs.combine(state$, instructions.state$);

  const children$ = allTheState$.map(renderSystem);

  const svg = SvgPanAndZoom({DOM, children$, attrs$: xs.of({'width': innerWidth, 'height': innerHeight})});

  const stateForUrl$ = xs.combine(controls.stateForLocation$, instructions.stateArray$)
    .map(([controlsState, instructionsState]) => ({controlsState, instructionsState}));

  return {
    DOM: xs.combine(state$, instructions.DOM, svg.DOM, controls.DOM).map(view),

    Location: stateForUrl$
  };
}

function view ([state, instructionsDOM, svg, controlsDOM]) {
  return div([
    controlsDOM,
    instructionsDOM,

    button('.go', 'GO!'),

    svg
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

    if (!poppedPosition) {
      return turtleState;
    }

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

function renderSystem ([state, instructionsState]) {
  const turtleState = {
    position: Vector({
      x: innerWidth / 2,
      y: 300
    }),

    direction: 270,

    positions: [
    ],

    lines: []
  };

  return state.system.split('').reduce((acc, character, index, characters) => turtleItUp(instructionsState, acc, character, index, characters), turtleState).lines;
}

function debug (val) {
  return pre(JSON.stringify(val, null, 2));
}

export default App;


// we want to store the axiom and the rules in the location state
// so that when we reload the page, the axiom and rules remain
