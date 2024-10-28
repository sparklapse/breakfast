Push-Location

irm bun.sh/install.ps1 | iex

Set-Location .\packages\@brekkie\obs
& $HOME\.bun\bin\bun.exe run build
Set Location ..\io
& $HOME\.bun\bin\bun.exe run build
Set Location ..\overlay
& $HOME\.bun\bin\bun.exe run build

