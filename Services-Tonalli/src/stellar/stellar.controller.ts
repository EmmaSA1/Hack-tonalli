import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { StellarService } from './stellar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stellar')
export class StellarController {
  private readonly logger = new Logger(StellarController.name);

  constructor(private readonly stellarService: StellarService) {}

  @Post('submit-signed')
  @UseGuards(JwtAuthGuard)
  async submitSigned(@Body() body: { xdr: string }) {
    this.logger.log('Receiving signed XDR for submission');
    return this.stellarService.submitSignedTransaction(body.xdr);
  }

  @Post('build-unsigned')
  @UseGuards(JwtAuthGuard)
  async buildUnsigned(@Body() body: { publicKey: string; operations: any[] }) {
    this.logger.log(`Building unsigned transaction for ${body.publicKey}`);
    const xdr = await this.stellarService.buildUnsignedTransaction(
      body.publicKey,
      body.operations,
    );
    return { xdr };
  }
}
