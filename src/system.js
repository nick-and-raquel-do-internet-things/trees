import {div, label, input} from '@cycle/dom';
import isolate from '@cycle/isolate';
import uniq from 'lodash/uniq';
import xs from 'xstream';

function System ({DOM, props$}) {
  function view (system) {
    return (
      div([
        label('System'),
        input('.system', {attrs: {value: system}})
      ])
    );
  }

  const axiomInput$ = DOM
    .select('.system')
    .events('input')
    .map(ev => ev.target.value);

  const axiom$ = xs.merge(props$, axiomInput$).startWith('');

  const characters$ = axiom$.map(uniq);

  return {
    DOM: axiom$.map(view),

    characters$,

    axiom$
  };
}

export default isolate(System);
