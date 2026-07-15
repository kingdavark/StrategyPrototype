@echo off
cd /d "%~dp0docs"
for %%f in (*.docx) do (
    echo Conversione di %%f...
    pandoc "%%f" -t gfm -o "%%~nf.md"
)
echo.
echo Conversion completed. All .docx files are converted as .md.
pause