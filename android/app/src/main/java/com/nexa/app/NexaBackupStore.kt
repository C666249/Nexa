package com.nexa.app

import android.content.Context
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

/** Explicit, local full backup. No private data is sent over a network. */
class NexaBackupStore(private val context: Context) {
    private val stage get() = File(context.filesDir, "nexa_import_stage")
    private val safeName = Regex("[A-Za-z0-9_.-]{1,180}")
    private val maxBytes = 1024L * 1024 * 1024
    private fun hash(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input -> val buffer = ByteArray(65536); while (true) { val n = input.read(buffer); if (n < 0) break; digest.update(buffer, 0, n) } }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }
    private fun json(file: File) = JSONObject(file.readText(Charsets.UTF_8))
    private fun prefs(): JSONObject {
        val result = JSONObject()
        File(context.applicationInfo.dataDir, "shared_prefs").listFiles()?.filter { it.extension == "xml" }?.forEach { file ->
            val name = file.nameWithoutExtension
            if (safeName.matches(name) && !name.startsWith("nexa_")) {
                val values = JSONObject()
                context.getSharedPreferences(name, Context.MODE_PRIVATE).all.forEach { (key, value) ->
                    val type = when (value) { is String -> "string"; is Boolean -> "boolean"; is Int -> "int"; is Long -> "long"; is Float -> "float"; is Set<*> -> "set"; else -> null }
                    if (type != null) values.put(key, JSONObject().put("type", type).put("value", if (value is Set<*>) JSONArray(value.toList()) else value))
                }
                result.put(name, values)
            }
        }
        return result
    }
    private fun applyPrefs(data: JSONObject) {
        for (name in data.keys()) {
            require(safeName.matches(name) && !name.startsWith("nexa_")) { "无效设置名称" }
            // Old in-flight app intents reference the other package and must not be replayed.
            if (name == "note_external_import" || name == "note_external_import_queue") continue
            val editor = context.getSharedPreferences(name, Context.MODE_PRIVATE).edit().clear()
            val values = data.getJSONObject(name)
            for (key in values.keys()) {
                val item = values.getJSONObject(key)
                when (item.getString("type")) {
                    "string" -> editor.putString(key, item.getString("value"))
                    "boolean" -> editor.putBoolean(key, item.getBoolean("value"))
                    "int" -> editor.putInt(key, item.getInt("value"))
                    "long" -> editor.putLong(key, item.getLong("value"))
                    "float" -> editor.putFloat(key, item.getDouble("value").toFloat())
                    "set" -> { val array = item.getJSONArray("value"); editor.putStringSet(key, (0 until array.length()).map { array.getString(it) }.toSet()) }
                    else -> error("无效设置类型")
                }
            }
            check(editor.commit()) { "设置写入失败" }
        }
    }
    fun export(uri: Uri, web: String) {
        JSONObject(web)
        val snapshot = File(context.cacheDir, "nexa_backup_" + System.nanoTime()).apply { check(mkdirs()) }
        try {
            File(snapshot, "web.json").writeText(web, Charsets.UTF_8)
            File(snapshot, "prefs.json").writeText(prefs().toString(), Charsets.UTF_8)
            for (dir in listOf("note_images", "note_files")) {
                File(context.filesDir, dir).listFiles()?.forEach { source ->
                    require(source.isFile && safeName.matches(source.name) && source.canonicalFile.parentFile == File(context.filesDir, dir).canonicalFile) { "附件路径异常" }
                    val dest = File(snapshot, "$dir/${source.name}"); dest.parentFile!!.mkdirs(); source.copyTo(dest)
                }
            }
            val files = snapshot.walkTopDown().filter { it.isFile }.toList()
            require(files.sumOf { it.length() } <= maxBytes) { "备份超过 1 GiB，请联系开发者处理，不会丢弃附件" }
            val entries = JSONArray()
            files.forEach { file -> entries.put(JSONObject().put("path", file.relativeTo(snapshot).invariantSeparatorsPath).put("size", file.length()).put("sha256", hash(file))) }
            File(snapshot, "manifest.json").writeText(JSONObject().put("format", "nexa-backup").put("version", 1).put("sourcePackage", context.packageName).put("createdAt", System.currentTimeMillis()).put("entries", entries).toString())
            context.contentResolver.openOutputStream(uri, "wt").use { output ->
                checkNotNull(output) { "无法写入备份文件" }
                ZipOutputStream(output.buffered()).use { zip ->
                    snapshot.walkTopDown().filter { it.isFile }.forEach { file -> zip.putNextEntry(ZipEntry(file.relativeTo(snapshot).invariantSeparatorsPath)); file.inputStream().use { it.copyTo(zip) }; zip.closeEntry() }
                }
            }
        } finally { snapshot.deleteRecursively() }
    }
    fun prepare(uri: Uri, beforeWeb: String) {
        check(!stage.exists()) { "存在未完成的恢复，请重新启动应用后处理" }
        check(stage.mkdirs())
        try {
            val seen = mutableSetOf<String>(); var total = 0L
            context.contentResolver.openInputStream(uri).use { input ->
                checkNotNull(input)
                ZipInputStream(input.buffered()).use { zip ->
                    while (true) {
                        val entry = zip.nextEntry ?: break
                        val name = entry.name
                        require(seen.add(name) && seen.size <= 20000 && !entry.isDirectory && (name in listOf("manifest.json", "web.json", "prefs.json") || Regex("(note_images|note_files)/[A-Za-z0-9_.-]{1,180}").matches(name))) { "无效或重复的备份路径" }
                        val dest = File(stage, name)
                        require(dest.canonicalPath.startsWith(stage.canonicalPath + File.separator)) { "不安全路径" }
                        dest.parentFile!!.mkdirs()
                        FileOutputStream(dest).use { out -> val buffer = ByteArray(65536); var size = 0L; while (true) { val n = zip.read(buffer); if (n < 0) break; total += n; size += n; require(total <= maxBytes && (!name.endsWith(".json") || name.contains('/') || size <= 32 * 1024 * 1024)) { "备份超出安全大小限制" }; out.write(buffer, 0, n) }; out.fd.sync() }
                        zip.closeEntry()
                    }
                }
            }
            val manifest = json(File(stage, "manifest.json"))
            require(manifest.getString("format") == "nexa-backup" && manifest.getInt("version") == 1) { "不支持此备份版本" }
            val listed = mutableSetOf("manifest.json"); val entries = manifest.getJSONArray("entries")
            for (i in 0 until entries.length()) {
                val entry = entries.getJSONObject(i); val name = entry.getString("path")
                require(name in seen && listed.add(name)) { "附件清单不一致" }
                val file = File(stage, name)
                require(file.length() == entry.getLong("size") && hash(file) == entry.getString("sha256")) { "备份校验失败：$name" }
            }
            require(listed == seen && seen.containsAll(listOf("web.json", "prefs.json"))) { "备份缺少数据或包含额外文件" }
            val web = json(File(stage, "web.json")); for (key in web.keys()) require(web.get(key) is String) { "无效网页数据" }
            json(File(stage, "prefs.json"))
            for (dir in listOf("note_images", "note_files")) {
                require(File(context.filesDir, dir).listFiles().isNullOrEmpty()) { "Nexa 已有附件，不能覆盖恢复" }
            }
            check(context.filesDir.usableSpace > total + 16 * 1024 * 1024) { "可用空间不足" }
            File(stage, "before-web.json").writeText(beforeWeb)
            File(stage, "before-prefs.json").writeText(prefs().toString())
            File(stage, "ready").writeText("1")
        } catch (e: Exception) { stage.deleteRecursively(); throw e }
    }
    @Synchronized fun pending(): String {
        if (!File(stage, "ready").exists()) { if (stage.exists()) stage.deleteRecursively(); return "" }
        if (File(stage, "committing").exists()) rollbackNative()
        return JSONObject().put("web", json(File(stage, "web.json"))).put("before", json(File(stage, "before-web.json"))).toString()
    }
    private fun rollbackNative() {
        for (dir in listOf("note_images", "note_files")) File(stage, dir).listFiles()?.forEach { source ->
            val destination = File(context.filesDir, "$dir/${source.name}")
            if (destination.exists()) { require(hash(destination) == hash(source)) { "恢复文件有冲突，已停止，保留所有数据" }; check(destination.delete()) }
        }
        applyPrefs(json(File(stage, "before-prefs.json")))
        // Clear imported preference files which did not exist in the empty destination.
        val before = json(File(stage, "before-prefs.json")); val imported = json(File(stage, "prefs.json"))
        for (name in imported.keys()) if (!before.has(name) && safeName.matches(name) && !name.startsWith("nexa_")) context.getSharedPreferences(name, Context.MODE_PRIVATE).edit().clear().commit()
        File(stage, "committing").delete()
    }
    @Synchronized fun commit(): String {
        return try {
            check(File(stage, "ready").exists())
            File(stage, "committing").writeText("1")
            for (dir in listOf("note_images", "note_files")) File(stage, dir).listFiles()?.forEach { source ->
                val destination = File(context.filesDir, "$dir/${source.name}"); require(!destination.exists()) { "附件已存在" }
                destination.parentFile!!.mkdirs()
                val tmp = File(destination.parentFile, ".nexa-pending")
                source.copyTo(tmp, overwrite = true); check(hash(tmp) == hash(source)); check(tmp.renameTo(destination))
            }
            applyPrefs(json(File(stage, "prefs.json")))
            // Commit marker first; crashes after this point must not roll back a completed import.
            check(File(stage, "ready").delete())
            stage.deleteRecursively()
            "ok"
        } catch (e: Exception) {
            try { rollbackNative() } catch (_: Exception) { return "恢复中断，数据已保留。请保留备份并联系开发者" }
            "恢复失败：${e.message}"
        }
    }
    @Synchronized fun cancel() { if (File(stage, "committing").exists()) rollbackNative(); stage.deleteRecursively() }
}
