package com.nexa.app

import android.app.Activity
import android.app.Instrumentation
import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import android.content.pm.ApplicationInfo
import android.net.Uri
import android.os.Bundle
import org.json.JSONObject
import java.io.File
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/** Native file/prefs verification runs only in the test APK's isolated private directory. */
class BackupInstrumentation : Instrumentation() {
    private class FixtureContext(base: Context, val name: String) : ContextWrapper(base) {
        private val root = File(base.filesDir, "native-test-$name").apply { mkdirs() }
        override fun getFilesDir() = File(root, "files").apply { mkdirs() }
        override fun getCacheDir() = File(root, "cache").apply { mkdirs() }
        override fun getApplicationInfo() = ApplicationInfo(super.getApplicationInfo()).apply { dataDir = root.path }
        override fun getSharedPreferences(key: String, mode: Int): SharedPreferences {
            File(root, "shared_prefs/$key.xml").apply { parentFile!!.mkdirs(); createNewFile() }
            return super.getSharedPreferences("fixture_${name}_$key", mode)
        }
    }
    override fun onCreate(arguments: Bundle?) { super.onCreate(arguments); start() }
    override fun onStart() {
        val result = Bundle()
        try {
            val run = System.nanoTime()
            val source = FixtureContext(targetContext, "source-$run")
            val dest = FixtureContext(targetContext, "dest-$run")
            val testFile = File(source.filesDir, "note_files/fixture.txt").apply { parentFile!!.mkdirs(); writeText("中文附件 · Nexa") }
            File(source.filesDir, "note_images/fixture.png").apply { parentFile!!.mkdirs(); writeBytes(byteArrayOf(1,2,3,4,5)) }
            source.getSharedPreferences("banner_time", 0).edit().putInt("hour", 21).putBoolean("enabled", true).putStringSet("test", setOf("a", "b")).commit()
            val web = JSONObject().put("todo_glass_data", "[{\"id\":1,\"text\":\"任务\"}]").put("todo_glass_note_docs_v2", "[]").put("todo_glass_history", "[\"搜索\"]").toString()
            val backup = File(source.cacheDir, "native-roundtrip.zip")
            NexaBackupStore(source).export(Uri.fromFile(backup), web)
            val store = NexaBackupStore(dest)
            store.prepare(Uri.fromFile(backup), "{}")
            check(JSONObject(store.pending()).getJSONObject("web").getString("todo_glass_data").contains("任务"))
            check(store.commit() == "ok")
            check(File(dest.filesDir, "note_files/fixture.txt").readText() == testFile.readText())
            check(File(dest.filesDir, "note_images/fixture.png").readBytes().contentEquals(byteArrayOf(1,2,3,4,5)))
            check(dest.getSharedPreferences("banner_time", 0).getInt("hour", -1) == 21)
            check(dest.getSharedPreferences("banner_time", 0).getStringSet("test", emptySet()) == setOf("a", "b"))
            check(store.pending().isEmpty())
            check(runCatching { store.prepare(Uri.fromFile(backup), "{}") }.isFailure) // Existing attachment guard.
            check(testFile.exists()) // Original always retained.
            val hostile = File(source.cacheDir, "hostile.zip")
            ZipOutputStream(hostile.outputStream()).use { it.putNextEntry(ZipEntry("../escape")); it.write(1); it.closeEntry() }
            check(runCatching { store.prepare(Uri.fromFile(hostile), "{}") }.isFailure)
            check(!File(dest.filesDir, "escape").exists())
            val rollback = FixtureContext(targetContext, "rollback-$run")
            rollback.getSharedPreferences("banner_time", 0).edit().putInt("hour", 18).commit()
            val rollbackStore = NexaBackupStore(rollback)
            rollbackStore.prepare(Uri.fromFile(backup), "{}")
            val stage = File(rollback.filesDir, "nexa_import_stage")
            File(stage, "prefs.json").writeText("{\"banner_time\":{\"hour\":{\"type\":\"unsupported\",\"value\":21}}}")
            check(rollbackStore.commit() != "ok")
            check(!File(rollback.filesDir, "note_files/fixture.txt").exists())
            check(rollback.getSharedPreferences("banner_time", 0).getInt("hour", -1) == 18)
            rollbackStore.cancel()
            // Emulate a process death during attachment commit, then restart recovery.
            rollbackStore.prepare(Uri.fromFile(backup), "{}")
            File(stage, "committing").writeText("1")
            File(rollback.filesDir, "note_files").mkdirs()
            File(stage, "note_files/fixture.txt").copyTo(File(rollback.filesDir, "note_files/fixture.txt"))
            check(rollbackStore.pending().isNotEmpty())
            check(!File(rollback.filesDir, "note_files/fixture.txt").exists())
            check(rollbackStore.commit() == "ok")
            check(File(rollback.filesDir, "note_files/fixture.txt").readText() == testFile.readText())
            result.putString("stream", "PASS: native ZIP roundtrip, Chinese attachment bytes, image bytes, typed preferences, no overwrite, original retained, traversal rejection, idempotent completion, forced commit failure rollback, interrupted commit recovery.\n")
            finish(Activity.RESULT_OK, result)
        } catch (e: Throwable) { result.putString("stream", "FAIL: ${e.stackTraceToString()}"); finish(Activity.RESULT_CANCELED, result) }
    }
}
