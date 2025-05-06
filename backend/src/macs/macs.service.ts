import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {DeepPartial, EntityManager, Repository} from "typeorm";
import {MAC} from "../common/database/entities/mac.entity";
import {MemberStatus} from "../common/database/entities/member.entity";

@Injectable()
export class MACsService {
    constructor(@InjectRepository(MAC) private macsRepository: Repository<MAC>) {
    }

    for(manager: EntityManager): MACsService {
        return new MACsService(manager.getRepository(MAC));
    }

    async findForActiveMembers(): Promise<MAC[]> {
        return await this.macsRepository.find({
            relations: {
                member: true
            },
            where: {
                member: {
                    status: MemberStatus.ACTIVE
                }
            }
        });
    }

    async find(): Promise<MAC[]> {
        return await this.macsRepository.find({
            relations: {
                member: true
            }
        });
    }

    async findById(id: string): Promise<MAC | null> {
        return await this.macsRepository.findOne({
            where: {
                id
            },
            relations: {
                member: true
            }
        });
    }

    async findByMemberId(memberId: string): Promise<MAC[]> {
        return await this.macsRepository.find({
            where: {
                member: {
                    id: memberId
                }
            }
        });
    }

    async create(data: DeepPartial<Exclude<MAC, "id">>): Promise<MAC> {
        const mac = this.macsRepository.create(data);
        await this.macsRepository.save(mac);
        return mac;
    }

    async remove(id: string): Promise<void> {
        await this.macsRepository.delete(id);
    }

    async transaction<T>(transactionFn: (manager: EntityManager) => Promise<T>): Promise<T> {
        return await this.macsRepository.manager.transaction(transactionFn);
    }
}