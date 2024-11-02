import { Client } from "ssh2";
import * as fs from "fs";

export const sshConnectAndExecute = (
  hostname: string,
  username: string,
  password: string,
  command: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = "";

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) throw err;
          stream
            .on("close", () => {
              conn.end();
              resolve(output);
            })
            .on("data", (data: Buffer) => {
              output += data.toString();
            });
          stream.end(`${command}\nexit\n`);
        });
      })
      .connect({
        host: hostname,
        port: 22,
        username: username,
        password: password,
      });
  });
};

export const sshConnectAndDownload = (
  hostname: string,
  username: string,
  password: string,
  remoteFilePath: string,
  localFilePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on("ready", () => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err);

          const remoteStream = sftp.createReadStream(remoteFilePath);
          const localstream = fs.createWriteStream(localFilePath);

          remoteStream.on("error", reject);
          localstream.on("error", reject);
          localstream.on("close", () => {
            conn.end();
            resolve();
          });

          remoteStream.pipe(localstream);
        });
      })
      .connect({
        host: hostname,
        port: 22,
        username: username,
        password: password,
      });
  });
};
