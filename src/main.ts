import { File } from "./file";
import minimist from "minimist";
import {
  checkFiles,
  generateSequence,
  mineSingle,
  verifyFolder,
} from "./miner";
import { lstatSync, opendir, opendirSync, readdirSync } from "fs";

// Parse the arguments
const args = minimist(process.argv.slice(2), {
  string: ["f1", "f2", "time", "id"],
  boolean: ["mine", "verify", "verbose", "help"],
  alias: {
    mine: "m",
    verify: "v",
    time: "t",
    help: "h",
  },
});

// Get the arguments
const f1 = args.f1;
const f2 = args.f2;
const mine = args.mine;
const verify = args.verify;
const time = args.time;
const verbose = args.verbose;
const help = args.help || args.h;
const id = args.id;

if (help) {
  console.log("Usage: node main.js [options]");
  console.log("Options:");
  console.log("\t--f1 <path>\t\tFile 1 path");
  console.log("\t--f2 <path>\t\tFile 2 path/dir");
  console.log("\t--mine\t\t\tMine a new sequence");
  console.log("\t--verify\t\tVerify a sequence");
  console.log("\t--time <time>\t\tTime to mine for");
  console.log("\t--verbose\t\tVerbose output");
  console.log("\t--help\t\t\tShow this help message");
  process.exit(0);
}

// Check if the arguments are valid
if (!f1 || !f2) {
  console.log("Invalid arguments");
  process.exit(1);
}

// Verify command was specified
if ((!mine && !verify) || (mine && verify)) {
  console.log("Invalid arguments");
  process.exit(1);
}

if (!id) {
  console.log("Invalid arguments, id not specified");
  process.exit(1);
}

const file1 = new File();
let file2 = new File();

// Mine command was specified
if (mine) {
  file1.read(f1).then(() => {
    const startTime = Date.now();
    let endTime = startTime + parseInt("60000");
    if (!time) console.warn("No time specified, mining for 60 seconds");
    else endTime = startTime + parseInt(time);

    let sequence = 0;
    let max = { sequence: 0, zeros: 0, hash: "" };

    while (Date.now() < endTime) {
      const result = mineSingle(file1, sequence, 100, id);
      if (result.zeros > max.zeros) {
        verbose &&
          console.log(
            `Mined ${result.sequence} with ${result.zeros} zeros in ${
              Date.now() - startTime
            }ms`
          );
        verbose && console.log(`Hash: ${result.hash}`);
        max = result;
      }
      sequence++;
    }

    if (max.hash !== "") {
      console.log(`Mining finished in ${Date.now() - startTime}ms`);
      console.log(`Mined ${max.sequence} with ${max.zeros} zeros`);
      console.log(`Hash: ${max.hash}`);

      // Append the sequence to the file and write it
      file2 = file1.append(generateSequence(max.sequence, 100, id));
      file2.write(f2);
    } else console.log("No sequence mined");
  });
}

// Verify command was specified
if (verify) verifyFolder(f1, f2, verbose);
