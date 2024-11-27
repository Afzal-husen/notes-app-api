import { CustomError } from "./custom-error.js";

export class BadRequestError extends CustomError {
  readonly statusCode: number = 400;
  readonly errorCode: string = "BAD_REQUEST_ERROR";

  constructor(public message: string, public code?: number) {
    super(message);

    if (code) this.statusCode = code;

    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  serializeError(): { message: string; code: string }[] {
    return [{ message: this.message, code: this.errorCode }];
  }
}
