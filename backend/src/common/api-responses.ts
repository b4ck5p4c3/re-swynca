import {ApiProperty} from "@nestjs/swagger";

export class ErrorApiResponse {
    @ApiProperty()
    statusCode: number;

    @ApiProperty()
    message: string;
}