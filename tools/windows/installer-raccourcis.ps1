# Crée les raccourcis « Prisme » sur le Bureau et dans le menu Démarrer de l'utilisateur courant.
# Usage : powershell -ExecutionPolicy Bypass -File tools\windows\installer-raccourcis.ps1
$here = $PSScriptRoot
$root = (Resolve-Path (Join-Path $here '..\..')).Path
$shell = New-Object -ComObject WScript.Shell
foreach ($dir in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
  $lnk = $shell.CreateShortcut((Join-Path $dir 'Prisme.lnk'))
  $lnk.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'
  $lnk.Arguments = '"' + (Join-Path $here 'lancer-prisme.vbs') + '"'
  $lnk.WorkingDirectory = $root
  $lnk.IconLocation = (Join-Path $here 'prisme.ico') + ',0'
  $lnk.Description = 'Prisme - apprendre en manipulant (application locale)'
  $lnk.Save()
  Write-Output ('Raccourci créé : ' + (Join-Path $dir 'Prisme.lnk'))
}
