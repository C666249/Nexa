param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$beta=(Get-Content -LiteralPath (Join-Path $projectRoot 'android/app/build.gradle.kts') -Raw).Contains('applicationId = "com.nexa.app.beta"')
$channel=if($beta){'Beta'}else{'Stable'}
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$target=Join-Path $OutputDirectory "Nexa-1.0.8-$channel.zip"
if(Test-Path -LiteralPath $target){throw "Archive already exists: $target"}
$files=Get-ChildItem -LiteralPath $projectRoot -Recurse -File | Where-Object {
 $rel=$_.FullName.Substring($projectRoot.Length+1)
 $rel -notmatch '(^|\\)(\.git|\.gradle|\.idea|\.kotlin|build|dist)(\\|$)' -and $_.Name -ne 'local.properties' -and $_.Name -notmatch '^emulator.*\.log$' -and $_.Extension -notin @('.apk','.aab','.jks','.keystore','.zip','.hprof')
}
$zip=[IO.Compression.ZipFile]::Open($target,[IO.Compression.ZipArchiveMode]::Create)
try {foreach($file in $files){$entry=$file.FullName.Substring($projectRoot.Length+1).Replace('\','/');[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$file.FullName,$entry,[IO.Compression.CompressionLevel]::Optimal)|Out-Null}}finally{$zip.Dispose()}
$zip=[IO.Compression.ZipFile]::OpenRead($target)
try {
 foreach($name in @('settings.gradle.kts','gradle/wrapper/gradle-wrapper.jar','android/app/src/main/assets/todo.html','WORKFLOW.md','PROJECT_STATE.md')){if(-not $zip.GetEntry($name)){throw "Missing $name"}}
 foreach($entry in $zip.Entries){$stream=$entry.Open();try{$stream.CopyTo([IO.Stream]::Null)}finally{$stream.Dispose()}}
 "Verified $channel source archive: $($zip.Entries.Count) entries"
}finally{$zip.Dispose()}
Get-FileHash -LiteralPath $target -Algorithm SHA256
