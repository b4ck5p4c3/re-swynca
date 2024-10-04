import {Module} from "@nestjs/common";
import {InMemorySessionStorageService} from "./in-memory-session-storage.service";
import {SessionStorageService} from "../session-storage.service";

@Module({
    providers: [{
        provide: SessionStorageService,
        useClass: InMemorySessionStorageService
    }],
    exports: [SessionStorageService]
})
export class InMemorySessionStorageModule {
}