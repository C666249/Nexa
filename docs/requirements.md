# Nexa 1.0 requirements

Source: D:/edge download/Chatgpt-app-projects/beta/To-Do-1.40.6-Stable.
New identity: Nexa / com.nexa.app / 1.0.0. Original app and data must remain untouched.
Final artifacts: Nexa-1.0.0-Stable.zip and corresponding APK, project root settings.gradle.kts.

Preserve ordinary Todo, checklist/subtasks/parent status, edit/delete/swipe/search/tags;
Note rich text, inline future-input title sizing, images/files, reading/editing, search,
favorites, tree/recent views; Daily calendar/history/statistics; AI and all other source
capabilities, including reminders, notifications, external file sharing and recycle bin.

Redesign five-page navigation: 首页, Todo, Note, Daily, Space. Dashboard shows real
current-day data, not sample screenshot numbers. Space must share hierarchical tags
across the three modules without breaking existing category/topic references.
Note toolbar: B, I, checklist, image, more; retain existing controls under more.
Improve Chinese italic boundaries without modifying stored text.
Checklist expansion/collapse must remain in-place and not recreate the DOM.

Migration must cover web storage, native preferences, note_images, note_files and
search/history state. Never delete old data. Exact migration route awaits confirmation:
the unchanged old package exposes no cross-app data access endpoint.
