import {Module} from "@nestjs/common";
import {ACSKeysController} from "./acs-keys.controller";
import {ACSKeysService} from "./acs-keys.service";

@Module({
    controllers: [ACSKeysController],
    providers: [ACSKeysService]
})
export class ACSKeysModule {
}