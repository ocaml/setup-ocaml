set __dirname=%1
set toolPath=%2
set version=%3
set repository=%4
set variant=%5

set CYGWIN_ROOT=c:\cygwin
%toolPath%\setup-x86_64.exe --quiet-mode --root %CYGWIN_ROOT% --site http://cygwin.mirror.constant.com --packages curl,diff,diffutils,dos2unix,git,m4,make,mercurial,mingw64-i686-gcc-core,mingw64-x86_64-binutils,mingw64-x86_64-gcc-core,mingw64-x86_64-gcc-g++,patch,perl,rsync,unzip
set PATH=%CYGWIN_ROOT%\wrapperbin;%CYGWIN_ROOT%\bin;%PATH%
dos2unix %__dirname%\install-ocaml-windows.sh
bash --login %__dirname%\install-ocaml-windows.sh %version% %repository% %variant%
@if %ERRORLEVEL% neq 0 exit /b 1
unix2dos %__dirname%\opam.bat
mkdir %CYGWIN_ROOT%\wrapperbin
copy %__dirname%\opam.bat %CYGWIN_ROOT%\wrapperbin\opam.bat
