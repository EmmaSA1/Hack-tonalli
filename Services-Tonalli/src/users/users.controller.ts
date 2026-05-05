import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { StellarService } from '../stellar/stellar.service';
import { SorobanService } from '../stellar/soroban.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly stellarService: StellarService,
    private readonly sorobanService: SorobanService,
  ) {}

  @Get('users/me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('users/me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() req,
    @Body() body: { displayName?: string; city?: string; character?: string },
  ) {
    const updated = await this.usersService.update(req.user.id, body);
    return this.usersService.getProfile(updated.id);
  }

  @Patch('users/me/setup')
  @UseGuards(JwtAuthGuard)
  async setupUser(
    @Req() req,
    @Body() body: { companion: string; avatarType: string },
  ) {
    return this.usersService.setupUser(
      req.user.id,
      body.companion,
      body.avatarType,
    );
  }

  @Patch('users/me/upgrade')
  @UseGuards(JwtAuthGuard)
  async upgradePlan(
    @Req() req,
    @Body() body: { plan: 'free' | 'pro' | 'max' },
  ) {
    const plan = body.plan || 'pro';
    return this.usersService.upgradePlan(req.user.id, plan);
  }

  @Get('users/me/rewards/history')
  @UseGuards(JwtAuthGuard)
  async getRewardHistory(@Req() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user.stellarPublicKey) return [];
    return this.sorobanService.getRewardHistory(user.stellarPublicKey);
  }

  @Get('users/me/rewards/total')
  @UseGuards(JwtAuthGuard)
  async getTotalRewards(@Req() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user.stellarPublicKey) return { totalStroops: 0, totalXlm: 0 };
    const totalStroops = await this.sorobanService.getUserTotalRewards(user.stellarPublicKey);
    return { totalStroops, totalXlm: totalStroops / 10_000_000 };
  }

  @Get('rankings')
  async getRankings() {
    return this.usersService.getRankings();
  }

  // ── Admin Endpoints ─────────────────────────────────────────────────────

  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminGetUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search = '',
  ) {
    return this.usersService.adminGetUsers(+page, +limit, search);
  }

  // ── Wallet Endpoints ────────────────────────────────────────────────────

  @Get('users/me/wallet/balance')
  @UseGuards(JwtAuthGuard)
  async getWalletBalance(@Req() req) {
    const user = await this.usersService.findById(req.user.id);
    const xlmBalance = user.stellarPublicKey
      ? await this.stellarService.getBalance(user.stellarPublicKey)
      : '0';
    const tnlBalance = user.stellarPublicKey
      ? await this.sorobanService.getTokenBalance(user.stellarPublicKey)
      : 0;

    return {
      custodialAddress: user.stellarPublicKey || null,
      externalAddress: user.externalWalletAddress || null,
      walletType: user.walletType || 'custodial',
      xlmBalance,
      tnlBalance,
    };
  }

  @Post('users/me/wallet/connect')
  @UseGuards(JwtAuthGuard)
  async connectWallet(
    @Req() req,
    @Body() body: { address: string },
  ) {
    const user = await this.usersService.connectExternalWallet(
      req.user.id,
      body.address,
    );
    return {
      message: 'External wallet connected successfully',
      externalWalletAddress: user.externalWalletAddress,
      walletType: user.walletType,
    };
  }

  @Post('users/me/wallet/disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnectWallet(@Req() req) {
    const user = await this.usersService.disconnectExternalWallet(req.user.id);
    return {
      message: 'External wallet disconnected',
      walletType: user.walletType,
    };
  }

  @Post('users/me/wallet/withdraw')
  @UseGuards(JwtAuthGuard)
  async withdrawToExternal(
    @Req() req,
    @Body() body: { amount: string },
  ) {
    const user = await this.usersService.findById(req.user.id);

    if (!user.externalWalletAddress) {
      return { success: false, error: 'No external wallet connected' };
    }
    if (!user.stellarSecretKey) {
      return { success: false, error: 'No custodial wallet available' };
    }

    const result = await this.stellarService.sendXLMReward(
      user.stellarSecretKey,
      user.externalWalletAddress,
      body.amount,
    );

    return {
      success: result.success,
      txHash: result.txHash,
      amount: body.amount,
      destination: user.externalWalletAddress,
      error: result.error,
    };
  }

  @Post('users/me/wallet/export-secret')
  @UseGuards(JwtAuthGuard)
  async exportSecret(
    @Req() req,
    @Body() body: { password: string },
  ) {
    return this.usersService.exportSecretKey(req.user.id, body.password);
  }
}
