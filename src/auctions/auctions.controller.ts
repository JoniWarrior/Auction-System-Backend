import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { JwtAuthGuard } from './../auth/guards/auth.guards';
import { Roles, RolesGuard } from './../auth/guards/roles.guards';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Roles("seller")
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() createAuctionDto: CreateAuctionDto) {
    return this.auctionsService.create(createAuctionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles("seller")
  @UseGuards(RolesGuard)
  @Get('/my-auctions-as-seller')
  findMyAuctions(@Req() req: Request) {
    const user = req['user'];
    console.log("User from Req Body: ", user);
    return this.auctionsService.findMyAuctionsAsSeller(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/my-auctions-as-bidder")
  findMyAuctionsAsBidder(@Req() req : Request) {
    const bidder = req["user"];
    console.log("User from Req Body: ", bidder);
    return this.auctionsService.findMyAuctionsAsBidder(bidder.id);
  }

  @Get()
  findAll() {
    return this.auctionsService.findAll();
  }


  @Get("finished")
  async getFinishedAuctions() {
    return await this.auctionsService.getFinishedAuctions();
  }

  @Get("active")
  async getActiveAuctions() {
    return await this.auctionsService.getActiveAuctions();
  }

  @Get("filter/status")
  findAuctionByStatus(@Query("status") status : string) {
    return this.auctionsService.findAuctionsByStatus(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuctionDto: UpdateAuctionDto) {
    return this.auctionsService.update(id, updateAuctionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auctionsService.remove(id);
  }

  @Get("/:auctionId/biddings")
  findBiddingsOfAuction(@Param("auctionId") auctionId : string) {
    return this.auctionsService.findBiddingsOfAuction(auctionId);
  }

  @Get(":id/winner")
  async getWinningBid(@Param("id") id : string) {
    return await this.auctionsService.getAuctionWinner(id);
  }

  @Post(":id/close")
  async closeAuction(@Param("id") id : string) {
    return await this.auctionsService.closeAuction(id);
  }
}