import {div, button} from '@cycle/dom';
import isolate from '@cycle/isolate';
import difference from 'lodash/difference';
import union from 'lodash/union';
import flatten from 'lodash/flatten';
import xs from 'xstream';
import Collection from '@cycle/collection';

import Rule from './rule';

function Rules ({DOM, characters$}) {
  function view (rulesDOM) {
    return (
      div('.rules', [
        div(rulesDOM),
        button('.add-rule', 'add rule')
      ])
    );
  }

  function diffArrays (a, b) {
    return difference(b, a); // required for folding
  }

  const initialNewCharacterState = {previous: [], diff: []};

  const diffCharacters = (acc, current) => ({
    diff: diffArrays(acc.previous, current),
    previous: union(acc.previous, current)
  });

  const ruleCharactersProxy$ = xs.create();

  const newCharacter$ = xs.merge(characters$, ruleCharactersProxy$)
    .fold(diffCharacters, initialNewCharacterState)
    .map(state => xs.fromArray(state.diff))
    .flatten();

  const addRuleFromButton$ = DOM
    .select('.add-rule')
    .events('click')
    .map(ev => ({character$: xs.of('')}));

  const newRule$ = newCharacter$.map(character => ({character$: xs.of(character)}));

  const addRule$ = xs.merge(
    addRuleFromButton$,
    newRule$
  );

  const rules$ = Collection(
    Rule,
    {DOM},
    addRule$,
    rule => rule.remove$
  );

  const rulesDOM$ = Collection.pluck(
    rules$,
    rule => rule.DOM
  );

  const ruleCharacters$ = Collection.pluck(
    rules$,
    rule => rule.transformationUniqueCharacters$
  ).map(flatten);

  ruleCharactersProxy$.imitate(ruleCharacters$);

  const rulesStuff$ = Collection.pluck(
    rules$,
    rule => xs.combine(rule.transformationCharacter$, rule.transformation$)
  );

  const rulesObject$ = rulesStuff$
    .map(rulesStuff => rulesStuff.reduce(arrayIntoObject, {}));

  return {
    DOM: rulesDOM$.map(view),

    rules$: rulesObject$
  };
}

function arrayIntoObject (object, [key, value]) {
  object[key] = value;

  return object;
}

export default isolate(Rules);
