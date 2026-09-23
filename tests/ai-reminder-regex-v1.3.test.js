// V1.3 regression runner. Execute from project root with:
//   node tests/ai-reminder-regex-v1.3.test.js
const fs = require('fs');
const source = fs.readFileSync('script_0.js', 'utf8');
const parserStart = source.indexOf('// ===== Reminder natural-language parser');
const promptStart = source.indexOf('// ===== AI System Prompt =====');
if (parserStart < 0 || promptStart < 0) throw new Error('AI reminder parser block not found');
eval(source.slice(parserStart, promptStart));

const base = new Date(2026, 7, 20, 10, 0, 0, 0).getTime();
Date.now = () => base;
function fmt(ts) { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function assert(cond, msg) { if (!cond) throw new Error('FAIL: ' + msg); console.log('PASS | ' + msg); }
const cases = [
  ['明天下午3点提醒我交材料','addTodo','交材料','2026-8-21 15:00'],
  ['后天上午10点提醒我复习刑法','addTodo','复习刑法','2026-8-22 10:00'],
  ['加一条交材料，8月25日15点提醒','addTodo','交材料','2026-8-25 15:00'],
  ['加一条学习的复习刑法，2026年8月25日20:30提醒','addTodo','复习刑法','2026-8-25 20:30'],
  ['给交材料设置明天下午3点提醒','setReminder','交材料','2026-8-21 15:00'],
  ['把交材料的提醒改到后天上午10点','setReminder','交材料','2026-8-22 10:00'],
  ['16点提醒我喝水','addTodo','喝水','2026-8-20 16:00'],
  ['提醒我16点钟喝水','addTodo','喝水','2026-8-20 16:00'],
  ['6个小时后提醒我喝水','addTodo','喝水','2026-8-20 16:00'],
  ['30分钟后提醒我吃药','addTodo','吃药','2026-8-20 10:30'],
  ['1小时30分钟后提醒我出门','addTodo','出门','2026-8-20 11:30'],
  ['2天后提醒我交材料','addTodo','交材料','2026-8-22 10:00']
];
for (const [input, action, target, when] of cases) {
  const r = parseRegexCommand(input);
  assert(r && r.action === action, input + ' action');
  assert((r.text || r.keyword) === target, input + ' target');
  assert(fmt(r.reminderAt) === when, input + ' time');
}
let r = parseRegexCommand('9点提醒我喝水');
assert(r.action === 'reminderClarification' && /上午还是下午/.test(r.message), 'ambiguous 9点 asks for AM/PM');
Date.now = () => new Date(2026,7,20,18,0,0,0).getTime();
r = parseRegexCommand('16点提醒我喝水');
assert(r.action === 'reminderClarification' && /已经过/.test(r.message), 'past today never silently rolls to tomorrow');
console.log('AI Reminder Regex V1.3 regression: PASS');
