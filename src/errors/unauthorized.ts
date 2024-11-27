import { CustomError } from "./custom-error.js";

export class UnauthorizedError extends CustomError {
  readonly statusCode: number = 401;
  readonly errorCode: string = "UNAUTHORZED_ERROR";

  constructor(public message: string, code: number = 401) {
    super(message);
    this.statusCode = code;

    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }

  serializeError() {
    return [{ message: this.message, code: this.errorCode }];
  }
}
