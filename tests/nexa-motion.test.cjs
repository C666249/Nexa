const { test } = require('node:test');
const assert = require('node:assert/strict');
const motion = require('../ui/nexa-motion.js');

test('motion system exposes intentional custom bezier curves', () => {
  assert.match(motion.ease.standard, /^cubic-bezier\(/);
  assert.match(motion.ease.settle, /^cubic-bezier\(/);
  assert.match(motion.ease.depart, /^cubic-bezier\(/);
  assert.notEqual(motion.ease.standard, motion.ease.depart);
});

test('curveAway uses a multi-stage curved departure and completes deletion callback', async () => {
  let frames, options, completed = 0;
  const classes = new Set();
  const el = {
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) },
    getBoundingClientRect: () => ({ width: 240, height: 80 }),
    animate: (f, o) => { frames = f; options = o; return { finished: Promise.resolve() }; }
  };
  motion.curveAway(el, () => { completed += 1; }, { direction: 1 });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(completed, 1);
  assert.equal(classes.has('nexa-departing'), false); // class is cleaned after the departure settles
  assert.ok(frames.length >= 3);
  assert.equal(frames.at(-1).opacity, 0);
  assert.match(frames.at(-1).transform, /translate/);
  assert.equal(options.easing, motion.ease.depart);
  assert.ok(options.duration >= 300);
});

test('curveAway safely falls back when no animatable card exists', () => {
  let completed = 0;
  motion.curveAway(null, () => { completed += 1; });
  assert.equal(completed, 1);
});


test('softSettle gently lowers a completing card and calls its state callback exactly once', async () => {
  let frames, options, completed = 0;
  const classes = new Set();
  const el = {
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) },
    animate: (f, o) => { frames = f; options = o; return { finished: Promise.resolve() }; }
  };
  motion.softSettle(el, () => { completed += 1; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(completed, 1);
  assert.equal(classes.has('nexa-completing'), false);
  assert.ok(frames.length >= 3);
  assert.match(frames.at(-1).transform, /translate3d\(0,9px,0\)/);
  assert.equal(options.easing, motion.ease.emphasized);
  assert.ok(options.duration >= 300 && options.duration <= 450);
});
