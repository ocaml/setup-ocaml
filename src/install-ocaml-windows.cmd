@setlocal
@echo off

:: This must be the /cygdrive-relative version of CYGWIN_ROOT in constants.ts
set CYGWIN_NATIVE_ROOT=/cygdrive/d/cygwin

set CACHE_ROOT=%GITHUB_WORKSPACE%\.github\caches
set OPAM_CACHE=%CACHE_ROOT%\opam\cache.tar

if not exist %CACHE_ROOT%\opam\bootstrap\nul md %CACHE_ROOT%\opam\bootstrap

if exist %OPAM_CACHE% (
  set INITIALISING=0
  if not exist %CYGWIN_ROOT%\bin\nul md %CYGWIN_ROOT%\bin
  copy %CACHE_ROOT%\opam\bootstrap\* %CYGWIN_ROOT%\bin\
  cd %CACHE_ROOT%\opam
  %CYGWIN_ROOT%\bin\tar -pxf cache.tar -C "%CYGWIN_NATIVE_ROOT%"
) else (
  set INITIALISING=1
  for %%c in (compiler build) do (
    if exist %CACHE_ROOT%\%%c\cache.tar (
      echo Base cache missing - ignoring %CACHE_ROOT%\%%c\cache.tar
      del %CACHE_ROOT%\%%c\cache.tar
    )
  )
)

if %INITIALISING% equ 0 goto next

%2\setup-x86_64.exe --quiet-mode --root %CYGWIN_ROOT% --site http://cygwin.mirror.constant.com --packages curl,diff,diffutils,git,m4,make,patch,perl,rsync,mingw64-x86_64-gcc-core,mingw64-x86_64-gcc-g++,unzip
copy %2\setup-x86_64.exe %CYGWIN_ROOT%
mkdir %CYGWIN_ROOT%\wrapperbin
copy %1\opam.cmd %CYGWIN_ROOT%\wrapperbin\opam.cmd
copy %CYGWIN_ROOT%\bin\tar.exe %CACHE_ROOT%\opam\bootstrap\
rem Trigger the first-time copying of the skeleton files
%CYGWIN_ROOT%\bin\bash -lc "uname -a"
for /f "usebackq delims=" %%f in (`%CYGWIN_ROOT%\bin\bash -lc "ldd /bin/tar | sed -ne 's|.* => \(/usr/bin/.*\) ([^)]*)$|\1|p' | xargs cygpath -w"`) do (
  echo Copying %%f
  copy %%f %CACHE_ROOT%\opam\bootstrap\
)

:next
%CYGWIN_ROOT%\bin\bash -l %1\install-ocaml-windows.sh %3
