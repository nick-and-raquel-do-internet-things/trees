import {div} from '@cycle/dom';
import isolate from '@cycle/isolate';
import xs from 'xstream';
import delay from 'xstream/extra/delay';

import Rules from './rules';
import System from './system';

// props is a stream of objects with axiom (str) and rules (array)
//
function Controls ({DOM, props$}) {
  function view ([systemDOM, rulesDOM, characters]) {
    return (
      div('.controls', [
        systemDOM,
        rulesDOM
      ])
    );
  }

  const system = System({DOM, props$: props$.map(props => props.axiom)});

  const magic$ = xs.merge(
    xs.of(true).compose(delay(100)),
    xs.of(false)
  ).debug('magic');

  const filteredCharacters$ = magic$.map(filtered => system.characters$.filter(() => filtered)).flatten();

  const rules = Rules({DOM, characters$: filteredCharacters$.debug('characters'), props$: props$.map(props => props.rules).debug('props')});

  const state$ = xs.combine(system.axiom$, rules.rules$)
    .map(([axiom, rules]) => ({axiom, rules}));

  const stateForLocation$ = xs.combine(system.axiom$, rules.rulesArray$)
    .map(([axiom, rules]) => ({axiom, rules}));

  return {
    DOM: xs.combine(system.DOM, rules.DOM, system.characters$).map(view),

    state$,

    stateForLocation$,

    newCharacter$: rules.newCharacter$
  };
}

export default isolate(Controls);
