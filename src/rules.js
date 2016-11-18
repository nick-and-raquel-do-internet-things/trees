import Collection from '@cycle/collection';
import {div, button} from '@cycle/dom';
import isolate from '@cycle/isolate';

import xs from 'xstream';
import combineObj from 'xs-combine-obj';

import Rule from './rule';

function rulesArrayIntoObject (rulesArray) {
  return rulesArray.reduce((rules, rule) => {
    rules[rule.character] = rule.transformation;

    return rules;
  }, {});
}

function Rules ({DOM, props$}) {
  function view (rulesDOM) {
    return (
      div('.rules', [
        div(rulesDOM),
        button('.add-rule', 'add rule')
      ])
    );
  }

  const addRuleFromButton$ = DOM
    .select('.add-rule')
    .events('click')
    .map(ev => ({props$: xs.of({character: '', transformation: ''})}));

  const rulesFromLocation$ = props$.map(xs.fromArray).flatten()
    .map(({character, transformation}) => ({props$: xs.of({character, transformation})}));

  const addRule$ = xs.merge(
    addRuleFromButton$,
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

  const rulesArray$ = Collection.pluck(
    rules$,
    rule => combineObj({character$: rule.character$, transformation$: rule.transformation$})
  );

  const rulesObject$ = rulesArray$.map(rulesArrayIntoObject);

  return {
    DOM: rulesDOM$.map(view),

    rules$: rulesObject$,

    rulesArray$
  };
}

export default isolate(Rules);
