@echo off
setlocal

:: %~dp0 represents directory of batch file
:: Get the name of the folder containing this file
for %%I in ("%~dp0.") do set "addonName=%%~nxI"

:: Reset the variable in case it was set elsewhere
set "runCommands="

set /P "runCommands=Would you like to create junctions in the shared com.mojang folder? (y/n): "
if /I "%runCommands%"=="y" (
	echo Running commands for "%addonName%"...
	mklink /j "%appdata%\Minecraft Bedrock\Users\Shared\games\com.mojang\development_resource_packs\%addonName%" "%~dp0resources"
	mklink /j "%appdata%\Minecraft Bedrock\Users\Shared\games\com.mojang\development_behavior_packs\%addonName%" "%~dp0behaviors"
) else (
	echo Cancelled
)
echo.
pause
