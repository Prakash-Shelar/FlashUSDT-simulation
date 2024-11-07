import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Erc20Service implements OnModuleInit {
  private readonly logger = new Logger(Erc20Service.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private minterData: { receiver: string; amount: ethers.BigNumberish } | null =
    null;

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');

    const abi = [
      'event Mint(address receiver, uint256 amount)',
      'function burn(address receiver, uint256 amount) public',
    ];

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, abi, this.wallet);
  }

  onModuleInit() {
    this.listenToMintEvent();
  }

  private listenToMintEvent() {
    this.contract.on(
      'Mint',
      (receiver: string, amount: ethers.BigNumberish) => {
        this.logger.log(
          `Mint event detected: minter=${receiver}, amount=${amount.toString()}`,
        );
        this.minterData = { receiver, amount };

        // Schedule burn job after 1 minute.
        setTimeout(() => this.executeBurn(), 60000);
      },
    );
  }

  private async executeBurn() {
    if (!this.minterData) {
      this.logger.warn('No minter data found for burning.');
      return;
    }

    try {
      const { receiver, amount } = this.minterData;
      const tx = await this.contract.burn(receiver, amount);
      this.logger.log(`Burn transaction sent: ${tx.hash}`);
      await tx.wait();
      this.logger.log(`Burn transaction confirmed.`);
    } catch (error) {
      this.logger.error('Error executing burn:', error);
    } finally {
      this.minterData = null; // Reset minter data after burn.
    }
  }
}
