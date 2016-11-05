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

  const system$ = DOM
    .select('.system')
    .events('input')
    .map(ev => ev.target.value)
    .startWith('');

  const characters$ = system$.map(uniq);

  return {
    DOM: system$.map(view),

    characters$
  };
}

export default isolate(System);
