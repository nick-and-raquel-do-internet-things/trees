import {div} from '@cycle/dom';
import isolate from '@cycle/isolate';
import xs from 'xstream';

import Rules from './rules';
import System from './system';

function Controls ({DOM}) {
  function view ([systemDOM, rulesDOM, characters]) {
    return (
      div('.controls', [
        systemDOM,
        rulesDOM
      ])
    );
  }

  const system = System({DOM});
  const rules = Rules({DOM, characters$: system.characters$});

  return {
    DOM: xs.combine(system.DOM, rules.DOM, system.characters$).map(view)
  };
}

export default isolate(Controls);
