import {div, button} from '@cycle/dom';
import xs from 'xstream';
import Collection from '@cycle/collection';

import Instruction from './instruction';

function Instructions ({DOM, props$}) {
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

  const instructionsFromProps$ = props$
    .map(props => xs.fromArray(props))
    .flatten()

  const newInstruction$ = xs.merge(
    add$,
    instructionsFromProps$
  );

  const instructions$ = Collection(
    Instruction,
    {DOM, character: '', instructions: []},
    newInstruction$,
    instruction => instruction.remove$
  );

  const instructionsDOM$ = Collection.pluck(
    instructions$,
    instruction => instruction.DOM
  );

  const stateArray$ = Collection.pluck(
    instructions$,
    instructions => xs.combine(
      instructions.instructionCharacter$,
      instructions.selectedInstructions$
    ).map(([character, instructions]) => ({character, instructions}))
  );

  const state$ = stateArray$.map(stateArray =>
    stateArray.reduce((state, {character, instructions}) => {
      state[character] = instructions;

      return state;
    }, {})
  );

  return {
    DOM: instructionsDOM$.map(view),

    state$,
    stateArray$
  };
}

export default Instructions;
