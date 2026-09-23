$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$targetZip = Join-Path $projectRoot 'dist\Nexa-1.0.0-RC2.zip'
if (Test-Path -LiteralPath $targetZip) { throw 'Output already exists; no source archive overwritten.' }
$paths = @('settings.gradle.kts','build.gradle.kts','gradle.properties','gradlew','gradlew.bat','gradle','AGENTS.md','README-NEXA.md','PROJECT_STATE.md','docs','ui','tests','tools','android/app/build.gradle.kts','android/app/proguard-rules.pro','android/app/src','migration/legacy-todo.html','migration/bridge-export.js','migration/bridge-project/settings.gradle.kts','migration/bridge-project/build.gradle.kts','migration/bridge-project/gradle.properties','migration/bridge-project/gradlew','migration/bridge-project/gradlew.bat','migration/bridge-project/gradle','migration/bridge-project/android/app/build.gradle.kts','migration/bridge-project/android/app/proguard-rules.pro','migration/bridge-project/android/app/src','dev-logs/nexa-rc2.md','dev-logs/rc2-screenshots')
$zip = [IO.Compression.ZipFile]::Open($targetZip, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($relative in $paths) {
        $source = Join-Path $projectRoot $relative
        $item = Get-Item -LiteralPath $source
        $files = if ($item.PSIsContainer) { Get-ChildItem -LiteralPath $source -File -Recurse } else { @($item) }
        foreach ($file in $files) {
            if ($file.Name -eq 'local.properties' -or $file.Extension -in @('.jks','.keystore','.apk')) { throw "Private/machine artifact in source selection: $($file.Name)" }
            $entry = $file.FullName.Substring($projectRoot.Length + 1).Replace('\','/')
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entry, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    }
} finally { $zip.Dispose() }
$read = [IO.Compression.ZipFile]::OpenRead($targetZip)
try {
    if (-not $read.GetEntry('settings.gradle.kts')) { throw 'Missing root settings.gradle.kts' }
    if (-not $read.GetEntry('android/app/src/main/assets/nexa-toolbar.js')) { throw 'Missing toolbar asset' }
    Write-Output "Verified archive entries: $($read.Entries.Count)"
} finally { $read.Dispose() }
Get-FileHash -LiteralPath $targetZip -Algorithm SHA256
