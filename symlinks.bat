@echo off
setlocal

:: Reset the variable in case it was set elsewhere
set "runCommands="

set /P "runCommands=Would you like to create symlinks in the shared com.mojang folder? (y/n): "
if /I "%runCommands%"=="y" (
	echo Running commands...
	:: %~dp0 represents directory of batch file
	mklink /j "%appdata%\Minecraft Bedrock\Users\Shared\games\com.mojang\development_resource_packs\mcbedrock-minigames" "%~dp0resources"
	mklink /j "%appdata%\Minecraft Bedrock\Users\Shared\games\com.mojang\development_behavior_packs\mcbedrock-minigames" "%~dp0behaviors"
) else (
	echo Cancelled
)
echo.
pause
