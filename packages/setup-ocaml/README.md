# setup-ocaml

The action does the following:

### Main

1. Change the file system behavioural parameters
   - **Windows only**
1. Retrieve the Cygwin cache
   - **Windows only**
   - If the cache already exists
1. Retrieve the opam cache
   - If the cache already exists
1. Prepare the Cygwin environment
   - **Windows only**
1. Save the Cygwin cache
   - **Windows only**
1. Install opam
1. Initialise the opam state
1. Install the OCaml compiler
   - If the opam cache was not hit
1. Remove the opam repositories
1. Save the opam cache
   - If the opam cache was not hit
1. Initialise the opam repositories
1. Retrieve the opam download cache
1. Install depext
   - On Windows, not only `opam-depext` is installed, but `depext-cygwinports` is installed as well
1. Retrieve the dune cache
   - If the dune cache feature is enabled
   - If the cache already exists
1. Install the latest dune and enable the dune cache feature
   - If the dune cache feature is enabled
1. Pin the opam files, if they exist
   - If the opam pin feature is not disabled
   - If there is an opam file in the workspace that matches the glob pattern
1. Install the system dependencies required by the opam files via depext
   - If the opam depext feature is enabled
   - If there is an opam file in the workspace that matches the glob pattern

### Post

The reason for not caching opam stuff in the post-stage (more precisely, why you can't) is due to the size of the cache and repeatability. They should be cached immediately after initialisation to minimize the size of the cache.

1. Remove oldest dune cache files to free space
   - If the dune cache feature is enabled
1. Save the dune cache
   - If the dune cache feature is enabled
1. Save the opam download cache

## What is the difference between opam dependencies and depext dependencies?

- opam dependencies: opam packages installed by `opam install`.
- depext dependencies: System packages installed by `apt-get install`, `yum install`, `brew install`, etc.
