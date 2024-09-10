import {HttpException, HttpStatus} from "@nestjs/common";

export class CustomValidationError extends HttpException {
    constructor(reason: string) {
        super(reason, HttpStatus.BAD_REQUEST);
    }
}