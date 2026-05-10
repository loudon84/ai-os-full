import Ajv from "ajv";
import addFormats from "ajv-formats";

let sharedAjv: Ajv | undefined;

export function createAjv(): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    allowUnionTypes: true
  });

  addFormats(ajv);
  return ajv;
}

export function getSharedAjv(): Ajv {
  if (!sharedAjv) {
    sharedAjv = createAjv();
  }
  return sharedAjv;
}

