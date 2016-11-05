import {label, input, select, option, div, button} from '@cycle/dom';
import xs from 'xstream';

const possibleInstructions = [
  {
    type: 'TURN_RIGHT',
    name: 'turn right',
    args: [
      { name: 'angle', type: 'number', defaultValue: 45, value: 45 }
    ]
  },
  {
    type: 'TURN_LEFT',
    name: 'turn left',
    args: [
      { name: 'angle', type: 'number', defaultValue: 45, value: 45 }
    ]
  },
  {
    type: 'GO_FORWARD',
    name: 'go forward',
    args: [
      { name: 'distance', type: 'number', defaultValue: 15, value: 15 }
    ]
  },
  {
    type: 'LOAD',
    name: 'load',
    args: []
  },
  {
    type: 'SAVE',
    name: 'save',
    args: []
  }
];

function renderInstructionOption (state, instruction, index) {
  const selected = state.selectedInstruction.type === instruction.type;

  return (
    option({attrs: {selected}}, instruction.name)
  );
}

function renderInstructionArgs (instruction) {
  return (
    div(
      instruction.args.map((arg, index) =>
        div([
          label(arg.name),
          input({attrs: { value: arg.value, 'data-index': index }})
        ])
      )
    )
  );
}

function view (state) {
  return (
    div('.instruction', [
      select(
        '.instruction-name',
        possibleInstructions.map((instruction, index) => renderInstructionOption(state, instruction, index))
      ),

      renderInstructionArgs(state.selectedInstruction),
      button('.remove', 'x')
    ])
  );
}

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

function InstructionPart ({DOM, ...props}) {
  const instructionFromProps = possibleInstructions.find(instruction => instruction.type === props.type);

  let selectedInstruction;

  if (instructionFromProps) {
    selectedInstruction = {...instructionFromProps, args: props.args};
  } else {
    selectedInstruction = possibleInstructions[0];
  }

  const initialState = {
    selectedInstruction
  };

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

export default InstructionPart;
