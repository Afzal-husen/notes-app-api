import { CustomError } from "./custom-error.js";

export class NotFoundError extends CustomError {
  readonly statusCode: number = 404;
  readonly errorCode: string = "NOT_FOUND_ERROR";

  constructor(public message: string, public code?: number) {
    super(message);
    if (code) this.statusCode = code;

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeError() {
    return [{ message: this.message, code: this.errorCode }];
  }
}
