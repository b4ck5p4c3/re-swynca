import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Balance} from "../common/database/entities/balance.entity";
import {DeepPartial, Repository} from "typeorm";

@Injectable()
export class BalancesService {
    constructor(@InjectRepository(Balance) private readonly balanceRepository: Repository<Balance>) {
    }

    async create(balanceData: DeepPartial<Balance>): Promise<Balance> {
        const balance = this.balanceRepository.create(balanceData);
        await this.balanceRepository.save(balance);
        return balance;
    }
}