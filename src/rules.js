import Collection from '@cycle/collection';
import {div, button} from '@cycle/dom';
import isolate from '@cycle/isolate';

import difference from 'lodash/difference';
import union from 'lodash/union';
import flatten from 'lodash/flatten';
import keyBy from 'lodash/keyBy';

import xs from 'xstream';
import combineObj from 'xs-combine-obj';

import Rule from './rule';

function Rules ({DOM, characters$, props$}) {
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
  const rulesFromLocation$ = props$.map(xs.fromArray).flatten()
    .map(({character, transformation}) => ({character$: xs.of(character), transformation$: xs.of(transformation)}));

  const addRule$ = xs.merge(
    addRuleFromButton$,
    newRule$,
    rulesFromLocation$
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

  const rulesArray$ = Collection.pluck(
    rules$,
    rule => combineObj({character$: rule.transformationCharacter$, transformation$: rule.transformation$})
  );

  const rulesObject$ = rulesArray$.map(rulesArray => keyBy(rulesArray, 'character'));

  return {
    DOM: rulesDOM$.map(view),

    rules$: rulesObject$,

    rulesArray$,

    newCharacter$
  };
}

export default isolate(Rules);
