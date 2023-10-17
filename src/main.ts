import { writeFile } from "fs";
import { File } from "./file";

const filePath = process.argv[2];
if (!filePath) throw new Error("No file path provided");

const file = new File();
file.read(filePath).then(() => {
  console.log(file.getSHA256());
});

// A1
file.read(filePath).then(() => {
  let sequence = 0;

  let f: File;

  do {
    f = file.append(
      `${sequence.toString(16).toLowerCase().padStart(8, "0")}\t16\t100`
    );
    f.print();
    sequence++;
  } while (f.getSHA256()[0] !== "0");

  console.log(`Sequence: ${sequence - 1}`);
  f.write("output.txt").then(() => {
    console.log("File written");
    console.log(f.getSHA256());
  });
});

// A2
// El resumen SHA-256 del fichero comienza por la secuencia de 0s más larga que se pueda obtener en un minuto de tiempo de ejecución del programa

file.read(filePath).then(() => {
  const MAX_TIME_MS = 60000;

  let totalTime = 0;
  let seq = 0;

  let longestSeq = 0;
  let longestSeqZeros = 0;

  while (totalTime < MAX_TIME_MS) {
    const start = Date.now();
    const f = file.append(
      `${seq.toString(16).toLowerCase().padStart(8, "0")}\t16\t100`
    );

    const hashZeros = f.getSHA256().match(/^0*/)?.[0].length || 0;
    if (longestSeqZeros < hashZeros) {
      // Found a new longest sequence
      longestSeq = seq;
      longestSeqZeros = hashZeros;
      console.log(
        `New longest sequence: 0x${longestSeq
          .toString(16)
          .toLowerCase()
          .padStart(8, "0")} num 0s ${longestSeqZeros}`
      );

      writeFile("output.txt", f.data, (err) => {
        if (err) throw err;
      });
    }

    seq++;
    const end = Date.now();
    totalTime += end - start;
  }

  console.log(longestSeq, longestSeqZeros);
});
