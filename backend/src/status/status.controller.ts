import {Controller, Get, HttpException, HttpStatus} from "@nestjs/common";
import {StatusService} from "./status.service";
import {NoAuth} from "../auth/no-auth.decorator";

@Controller()
export class StatusController {

    constructor(private statusService: StatusService) {
    }

    @Get("health")
    @NoAuth()
    async health(): Promise<string> {
        try {
            await this.statusService.isDatabaseOk();
        } catch (e) {
            throw new HttpException("down", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return "ok";
    }
}