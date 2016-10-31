import {label, input, div, button} from '@cycle/dom';
import Collection from '@cycle/collection';
import InstructionPart from './instruction-part';
import xs from 'xstream';

function Instruction ({DOM, character, instructions}) {
  // TODO - better name than instructions, they're really parts

  function view ([character, instructionsDOM]) {
    return (
      div('.instructions-container', [
        div([
          button('.remove', 'x'),
          label('Instruction character:'),
          input('.instruction-character', { attrs: { value: character } })
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
    .startWith(character);

  const instructionPartFromProps$ = xs.fromArray(instructions)
    .debug('instructionPartFromProps$');

  const newInstructionPart$ = xs.merge(
    add$,
    instructionPartFromProps$
  );

  const instructionParts$ = Collection(
    InstructionPart,
    {DOM},
    newInstructionPart$,
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
    DOM: xs.combine(instructionCharacter$, instructionPartsDOM$).map(view),

    selectedInstructions$,

    instructionCharacter$,

    remove$
  };
}

export default Instruction;
