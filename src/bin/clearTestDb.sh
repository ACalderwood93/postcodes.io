#!/usr/bin/env node

const	path = require("path");
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
  Ced,
} = require("../app/models/index");

const clearTestDb = (callback) => {
  if (process.env.PRESERVE_DB !== undefined) return callback(null);
  async.parallel(
    [
      Postcode,
      TerminatedPostcode,
      District,
      Parish,
      Nuts,
      County,
      Constituency,
      ScottishConstituency,
      Ccg,
      Ward,
      Outcode,
      Place,
      Ced,
    ].map((m) => m._destroyRelation.bind(m)),
    callback
  );
};

console.log("Cleaaring test DB");
clearTestDb(error => {
	if (error) throw error;
	console.log("Done.");
	process.exit(0);
});
