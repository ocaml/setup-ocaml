%2\setup-x86_64.exe --quiet-mode --root %CYGWIN_ROOT% --site http://cygwin.mirror.constant.com --packages curl,diff,diffutils,git,m4,make,patch,perl,rsync,mingw64-x86_64-gcc-core,mingw64-x86_64-gcc-g++,unzip
copy %2\setup-x86_64.exe %CYGWIN_ROOT%
set PATH=%CYGWIN_ROOT%\wrapperbin;%CYGWIN_ROOT%\bin;%PATH%
bash -l %1\install-ocaml-windows.sh %3
@if %ERRORLEVEL% neq 0 exit /b 1
mkdir %CYGWIN_ROOT%\wrapperbin
copy %1\opam.cmd %CYGWIN_ROOT%\wrapperbin\opam.cmd
