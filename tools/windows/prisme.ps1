# Lanceur Windows de Prisme : démarre le serveur local (port 10090) s'il ne tourne pas,
# vérifie que c'est bien Prisme qui répond, puis ouvre l'application dans sa propre fenêtre Edge.
# Les données des élèves restent dans le navigateur de cet ordinateur (origine http://localhost:10090).
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$port = 10090
$url = "http://localhost:$port/"

function Show-Error([string]$message) {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show($message, 'Prisme', 'OK', 'Error') | Out-Null
}

function Test-Prisme {
  # on lit la page d'accueil (texte HTML) et on vérifie que c'est bien Prisme qui répond sur ce port
  try {
    $client = New-Object System.Net.WebClient
    $client.Encoding = [System.Text.Encoding]::UTF8
    $html = $client.DownloadString($url + 'index.html')
    return $html -match '<title>Prisme'
  } catch { return $false }
}

if (-not (Test-Prisme)) {
  $busy = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($busy) {
    Show-Error "Le port $port est déjà utilisé par un autre programme : Prisme ne peut pas démarrer."
    exit 1
  }
  $node = (Get-Command node -ErrorAction SilentlyContinue).Source
  if (-not $node) {
    Show-Error "Node.js est introuvable. Installez Node.js (version 20 ou plus) puis relancez Prisme."
    exit 1
  }
  Start-Process -FilePath $node -ArgumentList 'tools/serve.js' -WorkingDirectory $root -WindowStyle Hidden
  $ready = $false
  for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 250
    if (Test-Prisme) { $ready = $true; break }
  }
  if (-not $ready) {
    Show-Error "Le serveur local de Prisme n'a pas répondu sur le port $port."
    exit 1
  }
}

$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") |
  Where-Object { Test-Path $_ } | Select-Object -First 1
if ($edge) {
  Start-Process -FilePath $edge -ArgumentList "--app=$url"
} else {
  Start-Process $url
}
