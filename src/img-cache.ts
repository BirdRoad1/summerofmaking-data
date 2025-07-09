import fs from "fs";
import { Readable } from "stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import crypto from "crypto";
import mime from "mime-types";
import nodeUrl from "url";

type ImageResult = {
  stream: ReadableStream;
  type: string;
};

export class ImageCache {
  getImage(url: string): ImageResult | null {
    try {
      let fileName = new nodeUrl.URL(url).pathname.split("/").pop();
      const name = crypto.hash("sha256", url, "hex");

      if (!fileName) {
        return null;
      }

      let type = mime.lookup(fileName);
      if (!type) {
        type = "application/bin";
      }

      const ext = mime.extension(type);
      const newFileName = "img_cache/" + name + "." + ext;

      if (!fs.existsSync(newFileName)) {
        return null;
      }

      return {
        stream: Readable.toWeb(
          fs.createReadStream(newFileName)
        ) as unknown as ReadableStream,
        type,
      };
    } catch (err) {
      console.log("Get cached image error:", err);
      return null;
    }
  }

  saveImage(url: string, stream: ReadableStream<Uint8Array>) {
    try {
      if (!fs.existsSync("img_cache/")) {
        fs.mkdirSync("img_cache/");
      }

      let fileName = new nodeUrl.URL(url).pathname.split("/").pop();
      const name = crypto.hash("sha256", url, "hex");

      if (!fileName) {
        return;
      }

      let type = mime.lookup(fileName);
      if (!type) {
        type = "application/bin";
      }

      const ext = mime.extension(type);
      const newFileName = "img_cache/" + name + "." + ext;

      if (fs.existsSync(newFileName)) {
        return;
      }

      const nodeStream = Readable.fromWeb(
        stream as unknown as NodeReadableStream
      );

      nodeStream.pipe(fs.createWriteStream(newFileName));
    } catch (err) {
      console.log("Cache error:", err);
    }
  }
}

export const imageCache = new ImageCache();
