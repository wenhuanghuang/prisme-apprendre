' Lanceur de Prisme sans fenetre de console : execute prisme.ps1 situe a cote de ce fichier.
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & dir & "\prisme.ps1""", 0, False
