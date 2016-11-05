import {span, div, button, input} from '@cycle/dom';
import isolate from '@cycle/isolate';
import xs from 'xstream';
import uniq from 'lodash/uniq';

function Rule ({DOM, character$}) {
  function view (character) {
    return (
      div('.rule', [
        input('.tranformation-character', {attrs: {value: character}}),
        span('  ->  '),
        input('.transformation-input', {attrs: {value: character}}),
        button('.remove', 'x') // TODO - use unicode times value
      ])
    );
  }

  const remove$ = DOM
    .select('.remove')
    .events('click');

  const rule$ = DOM
    .select('.transformation-input')
    .events('input')
    .map(ev => ev.target.value);

  const transformationCharacter$ = DOM
    .select('.transformation-character')
    .events('input')
    .map(ev => ev.target.value);

  const transformation$ = xs.merge(rule$, character$);

  const transformationUniqueCharacters$ = transformation$.map(uniq);

  return {
    DOM: character$.map(view),

    remove$,

    transformationUniqueCharacters$
  };
}

export default Rule;
