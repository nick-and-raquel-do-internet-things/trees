import {div, button} from '@cycle/dom';
import xs from 'xstream';
import Collection from '@cycle/collection';

import Instruction from './instruction';

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

    state$
  };
}

export default Instructions;
