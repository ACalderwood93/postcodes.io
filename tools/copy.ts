import * as shell from "shelljs";

// Copy all the view templates
shell.cp("-R", "src/app/views", "dist/app/");
shell.cp("-R", "src/bin/*.sh", "dist/bin/");
