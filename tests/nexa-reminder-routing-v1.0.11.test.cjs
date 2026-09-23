const {test}=require('node:test');
const a=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Todo and Daily reminder clicks are explicit single-task targets, not last-route restores',()=>{
  const manifest=read('android/app/src/main/AndroidManifest.xml');
  const notifier=read('android/app/src/main/java/com/nexa/app/reminder/ReminderNotifier.kt');
  const service=read('android/app/src/main/java/com/nexa/app/service/FloatWindowService.kt');
  a.match(manifest,/android:name="\.MainActivity"[\s\S]*android:launchMode="singleTask"[\s\S]*android:documentLaunchMode="never"/);
  a.match(notifier,/OPEN_TODO_REMINDER[\s\S]*nexa:\/\/reminder\/todo\/\$id[\s\S]*FLAG_ACTIVITY_CLEAR_TOP[\s\S]*EXTRA_FOCUS_TODO_ID/);
  a.match(notifier,/OPEN_DAILY_REMINDER[\s\S]*nexa:\/\/reminder\/daily\/\$id[\s\S]*FLAG_ACTIVITY_CLEAR_TOP[\s\S]*EXTRA_FOCUS_DAILY_TASK_ID/);
  a.match(service,/private fun openDaily\(id: Long\)[\s\S]*OPEN_DAILY_REMINDER[\s\S]*EXTRA_FOCUS_DAILY_TASK_ID/);
  a.match(service,/private fun openApp\(todoId: Long\?[\s\S]*OPEN_TODO_REMINDER[\s\S]*EXTRA_FOCUS_TODO_ID/);
});

test('native focus is acknowledged before pending target is consumed and retries while WebView settles',()=>{
  const main=read('android/app/src/main/java/com/nexa/app/MainActivity.kt');
  a.match(main,/window\.__focusTodoFromNative[\s\S]*accepted[\s\S]*pendingFocusTodoId = -1L[\s\S]*postDelayed\(\{ deliverPendingFocus\(\) \}, 140L\)/);
  a.match(main,/window\.__focusDailyFromNative[\s\S]*accepted[\s\S]*pendingFocusDailyTaskId = -1L[\s\S]*postDelayed\(\{ deliverPendingDailyFocus\(\) \}, 140L\)/);
  const html=read('ui/todo.html');
  a.match(html,/window\.__focusTodoFromNative = function\(id\)[\s\S]*NexaShell\.navigate\('todo'\)[\s\S]*nexaFlashTarget[\s\S]*return true/);
  a.match(html,/window\.__focusDailyFromNative = function\(id\)[\s\S]*openDailyDrawer\(id\)[\s\S]*nexaFlashTarget[\s\S]*return true/);
  a.match(html,/function nexaFlashTarget[\s\S]*nexa-target-highlight/);
});
