set CYGWIN_ROOT=c:\cygwin
%1/setup-x86_64.exe --quiet-mode --root %CYGWIN_ROOT% --site http://cygwin.mirror.constant.com --packages curl,diff,diffutils,git,m4,make,patch,perl,rsync,mingw64-x86_64-gcc-core,unzip
set PATH=%CYGWIN_ROOT%\wrapperbin;%CYGWIN_ROOT%\bin;%PATH%
dos2unix %GITHUB_WORKSPACE%\src\install-ocaml-windows.sh
bash -l %GITHUB_WORKSPACE%\src\install-ocaml-windows.sh %2
unix2dos %GITHUB_WORKSPACE%\src\opam.bat
mkdir %CYGWIN_ROOT%\wrapperbin
copy %GITHUB_WORKSPACE%\src\opam.bat %CYGWIN_ROOT%\wrapperbin\opam.bat
