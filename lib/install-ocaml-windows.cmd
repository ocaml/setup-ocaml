set CYGWIN_ROOT=c:\cygwin
%2/setup-x86_64.exe --quiet-mode --root %CYGWIN_ROOT% --site http://cygwin.mirror.constant.com --packages curl,diff,diffutils,git,m4,make,patch,perl,rsync,mingw64-x86_64-gcc-core,unzip
set PATH=%CYGWIN_ROOT%\wrapperbin;%CYGWIN_ROOT%\bin;%PATH%
dos2unix %1\install-ocaml-windows.sh
bash -l %1\install-ocaml-windows.sh %3
unix2dos %1\opam.bat
mkdir %CYGWIN_ROOT%\wrapperbin
copy %1\opam.bat %CYGWIN_ROOT%\wrapperbin\opam.bat
