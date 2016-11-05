import {div, label, input} from '@cycle/dom';
import isolate from '@cycle/isolate';
import uniq from 'lodash/uniq';

function System ({DOM}) {
  function view (system) {
    return (
      div([
        label('System'),
        input('.system', {attrs: {value: system}})
      ])
    );
  }

  const axiom$ = DOM
    .select('.system')
    .events('input')
    .map(ev => ev.target.value)
    .startWith('');

  const characters$ = axiom$.map(uniq);

  return {
    DOM: axiom$.map(view),

    characters$,

    axiom$
  };
}

export default isolate(System);
