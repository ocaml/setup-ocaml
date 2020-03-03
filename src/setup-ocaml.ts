import * as core from '@actions/core';
import * as installer from './installer';
import * as path from 'path';

async function run() {
  try {
    let ocaml_version = core.getInput('ocaml-version');
    await installer.getOpam(ocaml_version);
  } catch (error) {
    core.setFailed(error.toString());
  }
}

run();
