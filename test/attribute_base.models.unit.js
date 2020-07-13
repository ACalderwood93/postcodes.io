const helper = require("./helper/index");

[
  "Ccg",
  "Ced",
  "County",
  "Constituency",
  "District",
  "ScottishConstituency",
  "Nuts",
  "Parish",
  "Ward",
]
  .map((name) => helper[name])
  .forEach((model) => helper.AttributeBaseSuite.rigCoreSpecs(model));
