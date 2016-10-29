import {label, input, div, button} from '@cycle/dom';
import Collection from '@cycle/collection';
import InstructionPart from './instruction-part';

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
        button('.add-instruction', 'Add instruction')
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

export default Instruction;
