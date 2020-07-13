#!/usr/bin/env node

"use strict";

const {
  Postcode,
  District,
  Parish,
  County,
  Ccg,
  Constituency,
  ScottishConstituency,
  ScottishPostcode,
  Nuts,
  Ward,
  Outcode,
  Place,
  TerminatedPostcode,
  Ced
} = require("../app/models/index");
const handleError = error => {
	if (!error) return;
	console.log(`Error stopped test environment creation: ${error.message}`);
	process.exit(1);
};
const async = require("async");
const { join, resolve } = require("path");
const NO_RELOAD_DB = !!process.env.NO_RELOAD_DB;
const seedPostcodePath = resolve(__dirname, "../../test/seed/postcode.csv");
const seedPlacesPath = join(__dirname, "../../test/seed/places/");
const seedScotlandPostcodePath = resolve(__dirname, "../../test/seed/");

// Clear ONSPD table
const clearPostcodeDb = (callback) => {
  if (NO_RELOAD_DB) return callback(null);
  Postcode._destroyRelation(callback);
};

const seedPostcodeDb = (callback) => {
  if (NO_RELOAD_DB) return callback(null);
  async.series(
    [
      (cb) => Postcode._setupTable(seedPostcodePath, cb),
      (cb) => TerminatedPostcode._setupTable(seedPostcodePath, cb),
      (cb) => Place._setupTable(seedPlacesPath, cb),
      (cb) => ScottishPostcode._setupTable(seedScotlandPostcodePath, cb),
    ].concat(
      [
        District,
        Parish,
        Nuts,
        County,
        Constituency,
        ScottishConstituency,
        Ccg,
        Ward,
        Outcode,
        Ced,
      ].map((m) => m._setupTable.bind(m))
    ),
    callback
  );
};

console.log("Wiping test database...");
clearPostcodeDb((error, result) => {
	handleError(error);
	console.log("Done.");
	console.log("Recreating test database...");
	seedPostcodeDb((error, result) => {
		handleError(error);
		console.log("Done.");
		process.exit(0);
	});
});
