import {h, label, input, select, option, div, pre, button} from '@cycle/dom';
import xs from 'xstream';
import Collection from '@cycle/collection';

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

const possibleInstructions = [
  {
    name: 'turn right',
    args: [
      { name: 'angle', type: 'number', defaultValue: 45, value: 45 }
    ]
  },
  {
    name: 'turn left',
    args: [
      { name: 'angle', type: 'number', defaultValue: 45, value: 45 }
    ]
  },
  {
    name: 'go forward',
    args: [
      { name: 'distance', type: 'number', defaultValue: 15, value: 15 }
    ]
  },
  {
    name: 'load',
    args: []
  },
  {
    name: 'save',
    args: []
  }
];

function renderInstructionOption (instruction, index) {
  return (
    option(instruction.name)
  );
}

function renderInstructionArgs (instruction) {
  return (
    div(
      instruction.args.map((arg, index) =>
        div([
          label(arg.name),
          input({attrs: { value: arg.defaultValue, 'data-index': index }})
        ])
      )
    )
  );
}

function Instructions ({DOM}) {
  function view (instructionsDOM) {
    return (
      div([
        div('.instructions', instructionsDOM),
        button('.add', 'Add instruction')
      ])
    );
  }

  const add$ = DOM
    .select('.add')
    .events('click');

  const instructions$ = Collection(
    Instruction,
    {DOM},
    add$,
    instruction => instruction.remove$
  );

  const instructionsDOM$ = Collection.pluck(
    instructions$,
    instruction => instruction.DOM
  );

  const state$ = Collection.pluck(
    instructions$,
    instructions => xs.combine(
      instructions.instructionCharacter$,
      instructions.selectedInstructions$
    ).map(([character, instructions]) => ({character, instructions}))
  );

  return {
    DOM: instructionsDOM$.map(view),

    state$
  };
}

function Instruction ({DOM}) {
  function view (instructionsDOM) {
    return (
      div('.instructions-container', [
        div([
          button('.remove', 'x'),
          label('Instruction character:'),
          input('.instruction-character')
        ]),
        div('.instruction-parts', instructionsDOM),
        button('.add-instruction', 'Add instruction'),
      ])
    );
  }

  const add$ = DOM
    .select('.add-instruction')
    .events('click')
    .map(ev => ({}));

  const remove$ = DOM
    .select('.remove')
    .events('click');

  const instructionCharacter$ = DOM
    .select('.instruction-character')
    .events('change')
    .map(ev => ev.target.value)
    .startWith('');

  const instructionParts$ = Collection(
    InstructionPart,
    {DOM},
    add$,
    instructionPart => instructionPart.remove$
  );

  const instructionPartsDOM$ = Collection.pluck(
    instructionParts$,
    (instructionPart) => instructionPart.DOM
  );

  const selectedInstructions$ = Collection.pluck(
    instructionParts$,
    instructionPart => instructionPart.selectedInstruction$
  );

  return {
    DOM: instructionPartsDOM$.map(view),

    selectedInstructions$,

    instructionCharacter$,

    remove$
  };
}

function InstructionPart ({DOM}) {
  const initialState = {
    selectedInstruction: possibleInstructions[0]
  };

  function view (state) {
    return (
      div('.instruction', [
        select('.instruction-name', possibleInstructions.map(renderInstructionOption)),
        renderInstructionArgs(state.selectedInstruction),
        button('.remove', 'x')
      ])
    );
  }

  const selectInstruction$ = DOM
    .select('.instruction-name')
    .events('change')
    .map(ev => ({type: 'SELECT_INSTRUCTION', payload: ev.target.selectedIndex}));

  const changeArgValue$ = DOM
  .select('input')
  .events('input')
  .map(ev => ({type: 'CHANGE_ARG', payload: {index: ev.target.dataset.index, value: ev.target.value}}));

  const remove$ = DOM
    .select('.remove')
    .events('click');

  const action$ = xs.merge(
    selectInstruction$,
    changeArgValue$
  );

  const reducers = {
    SELECT_INSTRUCTION (state, instructionIndex) {
      return {
        ...state,

        selectedInstruction: possibleInstructions[instructionIndex]
      };
    },

    CHANGE_ARG (state, payload) {
      const selectedInstruction = state.selectedInstruction;
      const args = selectedInstruction.args.slice();
      const selectedArg = args[payload.index];

      args.splice(payload.index, 1, {...selectedArg, value: payload.value});

      return {
        ...state,

        selectedInstruction: {
          ...selectedInstruction,

          args
        }
      };
    }
  };

  const state$ = action$.fold((state, action) => {
    const reducer = reducers[action.type];

    if (!reducer) {
      throw new Error(`Implement a reducer for action type "${action.type}"`);
    }

    return reducer(state, action.payload);
  }, initialState);

  const selectedInstruction$ = state$.map(state => state.selectedInstruction);

  return {
    DOM: state$.map(view),

    selectedInstruction$,

    remove$
  };
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
    DOM: xs.combine(state$, instructions.DOM).map(view)
  };
}

function view ([state, instructionsDOM]) {
  return div([
    button('.go', 'GO!'),

    instructionsDOM,

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
