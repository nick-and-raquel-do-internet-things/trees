import {span, div, button, input} from '@cycle/dom';
import xs from 'xstream';

function Rule ({DOM, props$}) {
  function view ([character, transformation]) {
    return (
      div('.rule', [
        input('.transformation-character', {attrs: {value: character}}),
        span('  ->  '),
        input('.transformation-input', {attrs: {value: transformation}}),
        button('.remove', 'x') // TODO - use unicode times value
      ])
    );
  }

  const remove$ = DOM
    .select('.remove')
    .events('click');

  const characterFromProps$ = props$.map(props => props.character);
  const transformationFromProps$ = props$.map(props => props.transformation);

  const characterChange$ = DOM
    .select('.transformation-character')
    .events('input')
    .map(ev => ev.target.value);

  const transformationChange$ = DOM
    .select('.transformation-input')
    .events('input')
    .map(ev => ev.target.value);

  const character$ = xs.merge(
    characterFromProps$,
    characterChange$
  ).remember();

  const transformation$ = xs.merge(
    transformationFromProps$,
    transformationChange$
  ).remember();

  return {
    DOM: xs.combine(character$, transformation$).map(view),

    character$,

    transformation$,

    remove$
  };
}

export default Rule;
