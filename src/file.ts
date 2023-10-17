import { readFile, writeFile } from "fs";
import crypto from "crypto";

class File {
  constructor(data?: string, path?: string) {
    this.data = data || "";
    this.path = path || "";
  }

  data: string = "";
  hash: string = "";
  path: string = "";

  /**
   * Read the file at the specified path
   * @param path Path to the file to read
   * @returns Promise that resolves when the file is read
   */
  read(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      readFile(path, "utf-8", (err, data) => {
        if (err) reject(err);
        this.path = path;
        this.data = data.toString();
        resolve();
      });
    });
  }

  print(): void {
    console.log(this.data);
  }

  /**
   * Calculates the SHA256 hash of the file if it is not already calculated
   * @returns SHA256 hash of the file
   */
  getSHA256(): string {
    if (!this.data) throw new Error("File is empty");
    if (this.hash) return this.hash;

    const hash = crypto.createHash("sha256");
    hash.update(this.data);
    const sha256sum = hash.digest("hex");
    this.hash = sha256sum;
    return sha256sum;
  }

  resetSHA256(): void {
    this.hash = "";
    this.getSHA256();
  }

  /**
   * Write the file to the path specified or the path it was read from
   * @returns Promise that resolves when the file is written
   */
  write(path?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      writeFile(path || this.path, this.data, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  /**
   *  Returns the file data with the specified data appended
   */
  append(data: string): File {
    return new File(this.data + `\n${data}`);
  }

  /**
   * Append the SHA256 hash of the file to the file as a new line
   */
  appendHash(): File {
    return this.append(this.getSHA256());
  }

  /**
   * Verify that the start of both files is the same
   */
  verifyStart(file: File): boolean {
    return this.data.startsWith(file.data);
  }
}

export { File };
