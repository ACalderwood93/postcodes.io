"use strict";

const { inherits } = require("util");
const { join } = require("path");
const randomString = require("random-string");
const configFactory = require("../../src/config/config");
const config = configFactory();
const AttributeBaseSuite = require("./attribute_base.suite");

const postcodesioApplication = (cfg) => require("../../src/app")(cfg || config);

// Load models
const {
  Base,
  Postcode,
  TerminatedPostcode,
} = require("../../src/app/models/index");

// Infers columns schema from columnData
const inferSchemaData = (columnData) => {
  const columnName = columnData.column_name;
  const collationName = columnData.collation_name;

  let dataType = columnData.data_type;
  if (columnName === "id") {
    dataType = "SERIAL PRIMARY KEY";
  }
  if (dataType === "USER-DEFINED" && columnName === "location") {
    dataType = "GEOGRAPHY(Point, 4326)";
  }
  if (dataType === "USER-DEFINED" && columnName === "bounding_polygon") {
    dataType = "GEOGRAPHY(Polygon, 4326)";
  }
  if (dataType === "integer" || dataType === "double precision") {
    dataType = dataType.toUpperCase();
  }

  if (dataType === "character varying") {
    dataType = `VARCHAR(${columnData.character_maximum_length})`;
  }

  if (collationName) {
    dataType = `${dataType} COLLATE "${collationName}"`;
  }
  return [columnName, dataType];
};

// sort index definition objects by their collumn names
// used to assert equality between infered index definitions and real index definitions
const sortByIndexColumns = (a, b) => {
  if (a.column === b.column) {
    return Object.keys(b).length - Object.keys(a).length;
  } else {
    return a.column < b.column ? -1 : 1;
  }
};

// infers expected definition of javascript object that defines creation of an index
// for #createIndexes method
const inferIndexInfo = (indexDef) => {
  const impliedIndex = {};

  if (indexDef.search("UNIQUE") !== -1) {
    impliedIndex.unique = true; //not specified unless is unique
  }

  const strippedDef = indexDef.replace(/.*USING\s/, "");
  const indexType = strippedDef.match(/\w*/)[0];

  if (indexType !== "btree") {
    impliedIndex.type = indexType.toUpperCase(); //not specified unless NOT a btree;
  }

  const indexInfo = strippedDef.match(/\(.*\)/)[0].slice(1, -1);

  const splittedIndexInfo = indexInfo.split(" ");

  impliedIndex.column = splittedIndexInfo[0]; //contains name of an indexed collumn

  if (splittedIndexInfo.length === 2) {
    impliedIndex.opClass = splittedIndexInfo[1]; // if two words, second word specifies
    // operation class, which is always
    // specified explicitly
  }
  return impliedIndex;
};

// Location with nearby postcodes to be used in lonlat test requests
const locationWithNearbyPostcodes = function (callback) {
  const postcodeWithNearbyPostcodes = "AB14 0LP";
  Postcode.find(postcodeWithNearbyPostcodes, function (error, result) {
    if (error) return callback(error, null);
    return callback(null, result);
  });
};

function getCustomRelation() {
  const relationName = randomString({
      length: 8,
      numeric: false,
      letters: true,
      special: false,
    }),
    schema = {
      id: "serial PRIMARY KEY",
      somefield: "varchar(255)",
    };

  function CustomRelation() {
    Base.call(this, relationName, schema);
  }

  inherits(CustomRelation, Base);

  return new CustomRelation();
}

//Generates a random integer from 1 to max inclusive
const getRandom = (max) => Math.ceil(Math.random() * max);

const QueryTerminatedPostcode = `
	SELECT
		postcode
	FROM
		terminated_postcodes LIMIT 1
	OFFSET $1
`;

function randomTerminatedPostcode(callback) {
  const randomId = getRandom(8); // 9 terminated postcodes in the
  // testing database
  TerminatedPostcode._query(
    QueryTerminatedPostcode,
    [randomId],
    (error, result) => {
      if (error) return callback(error, null);
      if (result.rows.length === 0) return callback(null, null);
      callback(null, result.rows[0]);
    }
  );
}

const randomPostcode = (callback) => {
  Postcode.random((error, { postcode }) => {
    callback(error, postcode);
  });
};

const randomOutcode = (callback) => {
  return Postcode.random((error, { outcode }) => {
    callback(error, outcode);
  });
};

const randomLocation = (callback) => {
  return Postcode.random((error, { longitude, latitude }) => {
    callback(error, { longitude, latitude });
  });
};

const lookupRandomPostcode = (callback) => {
  Postcode.random((error, result) => {
    if (error) {
      throw error;
    }
    callback(result);
  });
};

module.exports = {
  // Data
  configFactory,
  config,

  // Methods
  ...require("./setup"),

  // HTTP Helpers
  ...require("./http"),

  removeDiacritics: require("./remove_diacritics"),
  inferIndexInfo,
  inferSchemaData,
  sortByIndexColumns,
  randomOutcode,
  randomPostcode,
  randomTerminatedPostcode,
  randomLocation,
  getCustomRelation,
  lookupRandomPostcode,
  locationWithNearbyPostcodes,

  // Type checking methods
  ...require("./type_checking"),

  // PG helper methods
  ...require("./pg"),

  // Test suites
  AttributeBaseSuite,

  // Libs
  unaccent: require("../../src/app/lib/unaccent"),
  errors: require("../../src/app/lib/errors"),
  string: require("../../src/app/lib/string"),
  timeout: require("../../src/app/lib/timeout"),

  // Load in models
  ...require("../../src/app/models/index"),

  seedPaths: {
    customRelation: join(__dirname, "../seed/customRelation.csv"),
  },

  // Export pcio application factory
  postcodesioApplication,
};
