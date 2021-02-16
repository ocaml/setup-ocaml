@setlocal
@echo off
set PATH=%CYGWIN_ROOT%\bin;%PATH%
ocaml-env exec -- opam.exe %*
