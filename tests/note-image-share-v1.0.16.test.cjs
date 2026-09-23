const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const html = read('ui/todo.html');
const main = read('android/app/src/main/java/com/nexa/app/MainActivity.kt');
const paths = read('android/app/src/main/res/xml/file_paths.xml');

test('Note images expose a durable Android share URI and Sharesheet path', () => {
  assert.match(paths, /files-path name="note_images" path="note_images\/"/);
  assert.match(main, /private fun getNoteImage\(fileName: String\): File\?/);
  assert.match(main, /private fun buildNoteImageShareIntent\(file: File\): Intent/);
  assert.match(main, /private fun getShareableFileUri\(file: File\): Uri/);
  assert.doesNotMatch(main, /getNoteFileUri\(/, 'stale unresolved helper must not remain');
  assert.match(main, /private fun openNoteFileWithExternalApp[\s\S]*?val uri = getShareableFileUri\(file\)/);
  assert.match(main, /Intent\(Intent\.ACTION_SEND\)/);
  assert.match(main, /clipData = ClipData\.newRawUri\("note_image", uri\)/);
  assert.match(main, /Intent\.FLAG_GRANT_READ_URI_PERMISSION/);
  assert.match(main, /fun shareNoteImage\(fileName: String, target: String\): String/);
  assert.match(main, /launchNoteShare\(buildNoteImageShareIntent\(file\), target, "分享图片"\)/);
  assert.match(main, /Intent\.createChooser\(baseIntent, chooserTitle\)/);
});

test('Note image sharing has one clean entry point in full-screen preview', () => {
  assert.match(html, /id="noteImagePreviewShare"/);
  assert.match(html, /noteImagePreviewShare'\)\?\.addEventListener\('click',[\s\S]*?openNoteImageActions\(noteImagePreviewFigure\)/);
  assert.match(html, /id="noteImageActionsOverlay"/);
  assert.match(html, /data-note-image-action="wechat"/);
  assert.match(html, /data-note-image-action="qq"/);
  assert.match(html, /data-note-image-action="more"/);
  assert.match(html, /data-note-image-action="delete"/);
  assert.doesNotMatch(html, /className = 'note-image-more'/, 'new inline images must not get the old bottom-left ellipsis');
  assert.doesNotMatch(html, /createNoteImageMoreButton/, 'inline ellipsis creation path must stay removed');
  assert.match(html, /function cleanupLegacyNoteImageMoreControls\(root\)/);
  assert.match(html, /cleanupLegacyNoteImageMoreControls\(bodyEl\)/);
  assert.match(html, /querySelectorAll\('\[data-note-image-more\], \.note-image-more'\)/, 'older stored note HTML is cleaned when opened');
  assert.match(html, /AndroidBridge\.shareNoteImage\(name, action\)/);
});

test('Back closes image actions before the full-screen image preview', () => {
  const actionsAt = html.indexOf("document.getElementById('noteImageActionsOverlay')");
  const previewAt = html.indexOf("document.getElementById('noteImagePreview');", actionsAt);
  assert.ok(actionsAt >= 0 && previewAt > actionsAt);
  assert.match(html, /closeNoteImageActions\(\); return 'note-image-actions'/);
  assert.match(html, /closeNoteImagePreview\(\); return 'note-image-preview'/);
});

test('File attachment More Apps now uses the same share chooser semantics', () => {
  assert.match(main, /launchNoteShare\(buildNoteFileShareIntent\(file\), target, "分享附件"\)/);
  assert.doesNotMatch(html, /action === 'more'\) result = String\(AndroidBridge\.openNoteFileExternally/);
  assert.match(html, /result = String\(AndroidBridge\.shareNoteFile\(activeNoteFileMeta\.name, action\)\)/);
});
