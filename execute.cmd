@echo off
REM Batch command to redirect text file input to cscript for ADODB testing
REM Usage: execute.cmd [command] [input_file] [/verbose]
REM Example: execute.cmd query Simpleinput.txt
REM Example: execute.cmd query Simpleinput.txt /verbose

setlocal enabledelayedexpansion

REM Check for verbose flag
set VERBOSE=false
if /i "%3"=="/verbose" set VERBOSE=true
if /i "%2"=="/verbose" set VERBOSE=true
if /i "%1"=="/verbose" set VERBOSE=true

REM Set default values
set COMMAND=%1
set INPUT_FILE=%2
set ADODB_SCRIPT=%~dp0lib\adodb.js

REM Check if command parameter is provided
if "%COMMAND%"=="" (
    echo Usage: %0 [command] [input_file]
    echo.
    echo Available commands:
    echo   query      - Execute SQL query
    echo   execute    - Execute SQL statement
    echo   schema     - Get database schema
    echo   transaction - Execute transaction
    echo.
    echo Example: %0 query Simpleinput.txt
    exit /b 1
)

REM Check if input file parameter is provided, default to Simpleinput.txt
if "%INPUT_FILE%"=="" (
    set INPUT_FILE=Simpleinput.txt
    echo Using default input file: Simpleinput.txt
)

REM Check if input file exists
if not exist "%INPUT_FILE%" (
    echo Error: Input file "%INPUT_FILE%" not found
    exit /b 1
)

REM Check if ADODB script exists
if not exist "%ADODB_SCRIPT%" (
    echo Error: ADODB script "%ADODB_SCRIPT%" not found
    exit /b 1
)

REM Use 32-bit cscript (required for JET driver compatibility)
set CSCRIPT_PATH=C:\Windows\SysWOW64\cscript.exe

if %VERBOSE%==true (
    echo.
    echo === VERBOSE DEBUG MODE ===
    echo Command: %COMMAND%
    echo Input file: %INPUT_FILE%
    echo ADODB script: %ADODB_SCRIPT%
    echo CScript path: %CSCRIPT_PATH%
    echo Current directory: %CD%
    echo Script directory: %~dp0
    echo Lib directory: %~dp0lib
    echo.

    echo Checking if files exist:
    if exist "%INPUT_FILE%" (
        echo ✓ Input file exists: %INPUT_FILE%
    ) else (
        echo ✗ Input file NOT found: %INPUT_FILE%
    )

    if exist "%ADODB_SCRIPT%" (
        echo ✓ ADODB script exists: %ADODB_SCRIPT%
    ) else (
        echo ✗ ADODB script NOT found: %ADODB_SCRIPT%
    )

    if exist "%CSCRIPT_PATH%" (
        echo ✓ CScript exists: %CSCRIPT_PATH%
    ) else (
        echo ✗ CScript NOT found: %CSCRIPT_PATH%
    )

    echo.
    echo Input file contents:
    echo ---START INPUT---
    type "%INPUT_FILE%"
    echo ---END INPUT---
    echo.

    echo Full command that will be executed:
    echo pushd "%~dp0lib"
    for %%I in ("%INPUT_FILE%") do echo type "%%~fI" ^| "%CSCRIPT_PATH%" adodb.js %COMMAND% //E:JScript 2^>^&1
    echo popd
    echo.
    pause
)

echo.
echo Executing ADODB %COMMAND% command...
echo Input file: %INPUT_FILE%
echo ADODB script: %ADODB_SCRIPT%
echo CScript: %CSCRIPT_PATH%
echo.

REM Execute cscript exactly like the working manual command
REM Command: cscript.exe adodb.js query //E:JScript
echo Raw Output from cscript (stdout + stderr combined):
echo ================================================
REM Convert input file to absolute path before changing directories
for %%I in ("%INPUT_FILE%") do set "FULL_INPUT_PATH=%%~fI"
pushd "%~dp0lib"
type "%FULL_INPUT_PATH%" | "%CSCRIPT_PATH%" adodb.js %COMMAND% //E:JScript 2>&1
set EXIT_CODE=%ERRORLEVEL%
popd
echo ================================================

echo.
echo Exit Code: %EXIT_CODE%
echo.

REM Interpret results like the Node.js interface does
if %EXIT_CODE% equ 0 (
    echo Status: SUCCESS - The output above should contain JSON results
    echo This is what the Node.js interface would receive as successful data.
) else (
    echo Status: ERROR - The output above contains error information
    echo This is what the Node.js interface would receive and parse as an error.
    echo.
    echo Common exit codes:
    echo   1 = General ADODB error
    echo   3 = JSON parsing error or JavaScript execution error
    echo   Other = System, cscript, or Windows library error
)

endlocal
