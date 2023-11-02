import { lstatSync, readdirSync } from "fs";
import { File } from "./file";

/**
 * Tomando como entrada dos ficheros de texto, obtenga como salida el resultado de comprobar estas dos condiciones:
 * El segundo de los dos ficheros de texto de entrada comienza exactamente por los mismos contenidos que el primero, seguido por una línea con las características especificadas para las actividades anteriores.
 * El resumen SHA-256 del segundo fichero en versión hex: tiene como prefijo una secuencia de 0’s
 * @param f1
 * @param f2
 * @returns true if the files are valid, false otherwise
 */
function checkFiles(f1: File, f2: File): boolean {
  // Check if the second file starts with the first file
  if (!f2.data.startsWith(f1.data)) {
    return false;
  }

  // Check if the second file ends with the correct sequence
  const sequence = f2.data.substring(f1.data.length).split("\t")[0].trim();
  if (!sequence) {
    return false;
  }

  // Check if the sequence has the correct length
  if (sequence.length !== 8) {
    return false;
  }

  // Check if sequence is valid
  const sequenceNumber = parseInt(sequence, 16);
  if (isNaN(sequenceNumber)) {
    return false;
  }

  // Check if the hash starts with a number of zeros
  const hash = f2.getSHA256();
  if (getZeros(hash) < 1) {
    return false;
  }

  return true;
}

/**
 * Generate a sequence string
 * @param sequence Number of the sequence to generate
 * @param ammount Number of coins to mine
 * @returns String with the sequence and the number of coins to mine
 */
function generateSequence(
  sequence: number,
  ammount: number,
  id: string
): string {
  return `${sequence
    .toString(16)
    .toLowerCase()
    .padStart(8, "0")}\t${id}\t${ammount}`;
}

/**
 * Get the sequence of a file
 * @param f File to get the sequence from
 * @returns Sequence of the file
 */
function getSequence(f: File): string {
  return f.data.split("\n").pop()?.split("\t")[0] || "";
}

/**
 * Get number of zeros at the start of the hash of the mined sequence
 * @param {string} hash hash of the mined sequence
 * @returns number of zeros of the hash of the mined sequence
 */
function getZeros(hash: string): number {
  return hash.match(/^0*/)?.[0].length || 0;
}

/**
 * Mine a single sequence
 * @param file file to mine
 * @param sequence sequence to mine
 * @param ammount number of coins to mine
 * @param id id of the miner
 * @returns number of zeros of the hash of the mined sequence
 */
function mineSingle(
  file: File,
  sequence: number,
  ammount: number,
  id: string
): { sequence: number; zeros: number; hash: string } {
  try {
    // Create the sequence string
    const s = generateSequence(sequence, ammount, id);

    // Append the sequence to the file
    const f = file.append(s);

    // Get the number of zeros in the hash
    const hashZeros = getZeros(f.getSHA256());

    // Return the sequence and the number of zeros
    return { sequence, zeros: hashZeros, hash: f.getSHA256() };
  } catch (err) {
    console.error(err);
    return { sequence, zeros: 0, hash: "" };
  }
}

/**
 * Mine a range of sequences
 * @param start mining sequence start
 * @param end mining sequence end
 * @param ammount number of coins to mine
 * @param file file to mine
 * @param id id of the miner
 * @returns the sequence and the number of zeros of the longest sequence
 */
function mineRange(
  start: number,
  end: number,
  ammount: number,
  file: File,
  id: string
): { sequence: number; zeros: number; hash: string } {
  try {
    // Call mineSingle for each sequence in the range
    let max = { sequence: 0, zeros: 0, hash: "" };
    for (let i = start; i < end; i++) {
      const r = mineSingle(file, i, ammount, id);
      if (r.zeros > max.zeros) max = r;
    }
    return max;
  } catch (err) {
    console.error(err);
    return { sequence: 0, zeros: 0, hash: "" };
  }
}

type folderStatus = {
  valid: number;
  invalid: number;
  total: number;
};

type verifyFolderResponse = {
  hashes: { hash: string; filename: string }[][];
  status: folderStatus;
};

/**
 * Verify a folder of files against a blockchain file
 * @param f1 Initial blockchain file
 * @param f2 Directory containing the files to verify
 * @param verbose Verbose mode
 */
function verifyFolder(f1: string, f2: string, verbose: boolean) {
  console.log("Verifying...");
  let res: verifyFolderResponse = {
    status: {
      valid: 0,
      invalid: 0,
      total: 0,
    },
    hashes: [],
  };
  const file1 = new File();
  const file2 = new File();

  // Veirfy block
  file1.read(f1).then(async () => {
    // Check if f2 is a directory
    if (lstatSync(f2).isDirectory()) {
      // Open the directory
      const dir = readdirSync(f2);
      let fp: Promise<void>[] = [];

      // Iterate over the files in the directory
      dir.forEach((file) => {
        verbose && console.log(file);
        // Read the file
        const f = file2.read(`${f2}/${file}`).then(() => {
          verbose && console.log(`Verifying ${file}`);
          res.status.total++;
          if (checkFiles(file1, file2)) {
            res.status.valid++;
            verbose && console.log(`${file} is valid`);
            // Add the hash to the list of hashes
            const hash = file2.getSHA256();
            if (res.hashes[getZeros(hash)] === undefined)
              res.hashes[getZeros(hash)] = [{ hash, filename: file }];
            else res.hashes[getZeros(hash)].push({ hash, filename: file });
          } else {
            res.status.invalid++;
            verbose && console.log(`${file} is invalid`);
          }
          verbose && console.log(`File hash: ${file2.getSHA256()}\n`);
        });
        fp.push(f);
      });
      Promise.all(fp).then(async () => {
        // Print the hashes when all files have been verified
        verbose && console.log(res.status);
        console.log(`VERIFIED ${res.status.valid}/${res.status.total} FILES`);
        console.log(`${res.status.invalid} INVALID FILES`);
        console.log(`${res.status.valid} VALID FILES`);
        console.log(`${res.status.total} TOTAL FILES`);
        console.log(`${(res.status.valid / res.status.total) * 100}% VALID`);
        verbose &&
          console.log(
            `Max Zeros (${res.hashes.length - 1}): ${res.hashes.pop()}`
          );

        // Obtain the winning hash
        // If tie, select the block with he highest sequence
        const winners = res.hashes.pop();
        if (!winners) {
          console.error("No winner hashes found");
          process.exit(1);
        }

        let winner = winners[0];
        const f = new File();
        await f.read(`${f2}/${winner.filename}`);
        let winnerSequence = parseInt(getSequence(f), 16);

        winners.forEach(async (w) => {
          const f = new File();
          await f.read(`${f2}/${w.filename}`);
          const sequence = parseInt(getSequence(f), 16);
          if (sequence > winnerSequence) {
            winner = w;
            winnerSequence = sequence;
          }
        });

        console.log(`WINNER: ${winner.filename}`);
        console.log(`SEQUENCE: ${winnerSequence.toString(16).toLowerCase()}`);
        console.log(`HASH: ${winner.hash}`);
      });
    } else {
      console.error("Not a directory");
      process.exit(1);
    }
  });
}

export {
  checkFiles,
  mineRange,
  mineSingle,
  getZeros,
  verifyFolder,
  generateSequence,
  getSequence,
};
