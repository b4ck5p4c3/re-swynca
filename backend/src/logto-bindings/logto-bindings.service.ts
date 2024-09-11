import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {LogtoBinding} from "../common/database/entities/logto-binding.entity";
import {DeepPartial, Repository} from "typeorm";
import {Member} from "../common/database/entities/member.entity";

@Injectable()
export class LogtoBindingsService {
    constructor(@InjectRepository(LogtoBinding)
                private logtoBindingRepository: Repository<LogtoBinding>) {
    }

    async create(logtoBindingData: DeepPartial<LogtoBinding>): Promise<LogtoBinding> {
        const logtoBinding = this.logtoBindingRepository.create(logtoBindingData);
        await this.logtoBindingRepository.save(logtoBinding);
        return logtoBinding;
    }

    async findByLogtoId(logtoId: string): Promise<LogtoBinding | null> {
        return this.logtoBindingRepository.findOne({
            where: {
                logtoId
            },
            relations: {
                member: true
            }
        })
    }

    async findByMemberId(memberId: string): Promise<LogtoBinding | null> {
        return this.logtoBindingRepository.findOne({
            where: {
                member: {
                    id: memberId
                }
            },
            relations: {
                member: true,
            }
        });
    }
}