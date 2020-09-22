set __dirname=%1
set toolPath=%2
set version=%3
set repository=%4
set variant=%5

set CYGWIN_ROOT=c:\cygwin
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
%2\setup-x86_64.exe --quiet-mode --root %CYGWIN_ROOT% --site http://cygwin.mirror.constant.com --packages curl,diff,diffutils,git,m4,make,patch,perl,rsync,mingw64-x86_64-gcc-core,mingw64-x86_64-gcc-g++,unzip
copy %2\setup-x86_64.exe %CYGWIN_ROOT%
=======
%toolPath%\setup-x86_64.exe --quiet-mode --root %CYGWIN_ROOT% --site http://cygwin.mirror.constant.com --packages curl,diff,diffutils,git,m4,make,patch,perl,rsync,unzip,mingw64-i686-gcc-core,mingw64-x86_64-gcc-core
=======
%toolPath%\setup-x86_64.exe --quiet-mode --root %CYGWIN_ROOT% --site http://cygwin.mirror.constant.com --packages curl,diff,diffutils,git,m4,make,patch,perl,rsync,unzip,mingw64-i686-gcc-core,mingw64-x86_64-gcc-core,mingw64-i686-binutils,mingw64-x86_64-binutils
>>>>>>> 062c152 (Add "binutils" into any Cygwin installation)
=======
%toolPath%\setup-x86_64.exe --quiet-mode --root %CYGWIN_ROOT% --site http://cygwin.mirror.constant.com --packages curl,diff,diffutils,dos2unix,git,m4,make,patch,perl,rsync,unzip,mingw64-i686-gcc-core,mingw64-x86_64-gcc-core,mingw64-i686-binutils,mingw64-x86_64-binutils
>>>>>>> 5cfeec4 (Change ~ add 'dos2unix' to all platforms for portable bash shell construction)
=======
%toolPath%\setup-x86_64.exe --quiet-mode --root %CYGWIN_ROOT% --site http://cygwin.mirror.constant.com --packages curl,diff,diffutils,dos2unix,git,m4,make,mercurial,patch,perl,rsync,unzip,mingw64-i686-gcc-core,mingw64-x86_64-gcc-core,mingw64-i686-binutils,mingw64-x86_64-binutils
<<<<<<< HEAD
>>>>>>> 9fc579b (Change ~ add more support for opam supported repository types (darcs, git, mercurial, rsync))
copy %toolPath%\setup-x86_64.exe %CYGWIN_ROOT%
>>>>>>> 2cdfd3c (Add support for OCaml compiler version variants)
=======
>>>>>>> ba59f81 (Change ~ don't install a user-accessible copy of the Cygwin setup program)
set PATH=%CYGWIN_ROOT%\wrapperbin;%CYGWIN_ROOT%\bin;%PATH%
dos2unix %__dirname%\install-ocaml-windows.sh
bash -l %__dirname%\install-ocaml-windows.sh %version% %repository% %variant%
@if %ERRORLEVEL% neq 0 exit /b 1
unix2dos %__dirname%\opam.bat
mkdir %CYGWIN_ROOT%\wrapperbin
copy %__dirname%\opam.bat %CYGWIN_ROOT%\wrapperbin\opam.bat
