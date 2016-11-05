import {h, div, pre, button, label, input} from '@cycle/dom';
import isolate from '@cycle/isolate';
import xs from 'xstream';
import SvgPanAndZoom from 'cycle-svg-pan-and-zoom';
import uniq from 'lodash/uniq';
import flatten from 'lodash/flatten';
import difference from 'lodash/difference';
import Collection from '@cycle/collection';

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

function Controls ({DOM}) {
  function view ([systemDOM, rulesDOM, characters]) {
    return (
      div('.controls', [
        systemDOM,
        rulesDOM
      ])
    );
  }

  const system = isolate(System)({DOM});
  const rules = isolate(Rules)({DOM, characters$: system.characters$});

  return {
    DOM: xs.combine(system.DOM, rules.DOM, system.characters$).map(view)
  };
}

function System ({DOM}) {
  function view (system) {
    return (
      div([
        label('System'),
        input('.system', {attrs: {value: system}})
      ])
    );
  }

  const system$ = DOM
    .select('.system')
    .events('input')
    .map(ev => ev.target.value)
    .startWith('');

  const characters$ = system$.map(uniq);

  return {
    DOM: system$.map(view),

    characters$
  };
}

function Rules ({DOM, characters$}) {
  function view (rulesDOM) {
    return (
      div('.rules', rulesDOM)
    );
  }

  function diffArrays (a, b) {
    return difference(b, a); // required for folding
  }

  const initialNewCharacterState = {previous: [], diff: []};

  const diffCharacters = (acc, current) => ({
    diff: diffArrays(acc.previous, current),
    previous: current
  });

  const ruleCharactersProxy$ = xs.create();

  const newCharacter$ = xs.merge(characters$, ruleCharactersProxy$)
    .fold(diffCharacters, initialNewCharacterState)
    .map(state => xs.fromArray(state.diff))
    .flatten();

  const newRule$ = newCharacter$.map(character => ({character$: xs.of(character)}));

  const rules$ = Collection(
    Rule,
    {DOM},
    newRule$,
    rule => rule.remove$
  );

  const rulesDOM$ = Collection.pluck(
    rules$,
    rule => rule.DOM
  );

  const ruleCharacters$ = Collection.pluck(
    rules$,
    rule => rule.characters$
  ).map(flatten);

  ruleCharactersProxy$.imitate(ruleCharacters$);

  return {
    DOM: rulesDOM$.map(view)
  };
}

function Rule ({DOM, character$}) {
  function view (character) {
    return (
      div('.rule', [
        label(`${character} -> `),
        input('.rule-input', {attrs: {value: character}}), // TODO - make this transformation
        button('.remove', 'x') // TODO - use unicode times value
      ])
    );
  }

  const remove$ = DOM
    .select('.remove')
    .events('click');

  const rule$ = DOM
    .select('.rule-input')
    .events('input')
    .map(ev => ev.target.value);

  const characters$ = xs.merge(rule$, character$).map(uniq);

  return {
    DOM: character$.map(view),

    remove$,

    characters$ // TODO - rename transformation characters or some shit
  };
}

function App ({DOM, Location}) {
  const initialState = {
    system: '0',

    rules: [
     {character: '1', transformation: '11'},
     {character: '0', transformation: '1[0]0'}
    ]
  };

  const goAction$ = DOM
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

  const instructionsProps$ = Location.map(location => location.instructionsState);

  const instructions = Instructions({DOM, props$: instructionsProps$});

  const allTheState$ = xs.combine(state$, instructions.state$);

  const children$ = allTheState$.map(renderSystem);

  const svg = SvgPanAndZoom({DOM, children$, attrs$: xs.of({'width': innerWidth, 'height': innerHeight})});

  const stateForUrl$ = xs.combine(state$, instructions.stateArray$)
    .map(([state, instructionsState]) => ({state, instructionsState}));

  return {
    DOM: xs.combine(state$, instructions.DOM, svg.DOM).map(view),
    Location: stateForUrl$
  };
}

function view ([state, instructionsDOM, svg]) {
  return div([
    controls.DOM, // TODO -make this work
    instructionsDOM,

    button('.go', 'GO!'),

    // TODO - renable svg
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

export default Controls;
