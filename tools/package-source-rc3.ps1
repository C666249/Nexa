$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root=$PSScriptRoot | Split-Path
$target=Join-Path $root 'dist\Nexa-1.0.1-RC3-Source.zip'
if(Test-Path -LiteralPath $target){throw 'Output already exists; refusing overwrite.'}
$paths=@('settings.gradle.kts','build.gradle.kts','gradle.properties','gradlew','gradlew.bat','gradle','.gitignore','AGENTS.md','CLAUDE.md','README-NEXA.md','PROJECT_STATE.md','docs','ui','tests','tools','android/app/build.gradle.kts','android/app/proguard-rules.pro','android/app/src','migration/legacy-todo.html','migration/bridge-export.js','dev-logs/nexa-rc3.md')
$zip=[IO.Compression.ZipFile]::Open($target,[IO.Compression.ZipArchiveMode]::Create)
try{foreach($rel in $paths){$item=Get-Item -LiteralPath (Join-Path $root $rel);$files=if($item.PSIsContainer){Get-ChildItem -LiteralPath $item.FullName -File -Recurse}else{@($item)};foreach($file in $files){if($file.Extension -in @('.apk','.jks','.keystore') -or $file.Name -eq 'local.properties'){throw "Private/machine artifact: $($file.Name)"};$entry=$file.FullName.Substring($root.Length+1).Replace('\','/');[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$file.FullName,$entry,[IO.Compression.CompressionLevel]::Optimal)|Out-Null}}}finally{$zip.Dispose()}
$read=[IO.Compression.ZipFile]::OpenRead($target);try{foreach($required in @('settings.gradle.kts','android/app/src/main/assets/nexa-highlight.js','android/app/src/main/assets/nexa-gestures.css','android/app/src/main/java/com/nexa/app/NexaBackupStore.kt')){if(-not $read.GetEntry($required)){throw "Missing $required"}};"Source ZIP verified: $($read.Entries.Count) entries"}finally{$read.Dispose()}
Get-FileHash -LiteralPath $target -Algorithm SHA256
