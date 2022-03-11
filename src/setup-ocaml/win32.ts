import { HttpClient } from "@actions/http-client";
import * as cheerio from "cheerio";
import * as semver from "semver";

function createHttpClient(): HttpClient {
  return new HttpClient(`ocaml/setup-ocaml`, [], {
    allowRetries: true,
    maxRetries: 5,
  });
}

export async function getCygwinVersion(): Promise<string> {
  const httpClient = createHttpClient();
  const response = await httpClient.get("https://www.cygwin.com");
  const body = await response.readBody();
  const $ = cheerio.load(body);
  let version = "";
  $("a").each((_index, element) => {
    const text = $(element).text();
    if (semver.valid(text) === text) {
      version = text;
    }
  });
  return version;
}
