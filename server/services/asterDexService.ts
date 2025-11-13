import Web3 from 'web3';
import { ethers } from 'ethers';
import axios from 'axios';

// AsterDEX Trading Contract on BSC
const ASTERDEX_ADDRESS = '0x1b6F2d3844C6ae7D56ceb3C3643b9060ba28FEb0';
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';

// BSC RPC endpoints
const BSC_WSS_RPC = process.env.BSC_WSS_RPC || 'wss://lb.drpc.org/ogWSockets?network=bsc&dkey=AsGUZ98Ja0v8psqFQO9c7SFP1HZosp8R8LzKQrxF2MGT';
const BSC_HTTP_RPC = process.env.BSC_HTTP_RPC || 'https://lb.drpc.org/ogrpc?network=bsc&dkey=AsGUZ98Ja0v8psqFQO9c7SFP1HZosp8R8LzKQrxF2MGT';

// Minimal ABI for essential events and functions
const ASTERDEX_ABI = [
  // TradeOpened event
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tradeHash', type: 'bytes32' },
      { indexed: true, name: 'trader', type: 'address' },
      { indexed: false, name: 'pairIndex', type: 'uint256' },
      { indexed: false, name: 'isLong', type: 'bool' },
      { indexed: false, name: 'collateral', type: 'uint256' },
      { indexed: false, name: 'leverage', type: 'uint256' },
      { indexed: false, name: 'openPrice', type: 'uint256' },
    ],
    name: 'TradeOpened',
    type: 'event',
  },
  // TradeClosed event
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tradeHash', type: 'bytes32' },
      { indexed: true, name: 'trader', type: 'address' },
      { indexed: false, name: 'closePrice', type: 'uint256' },
      { indexed: false, name: 'pnl', type: 'int256' },
      { indexed: false, name: 'closeType', type: 'uint8' },
    ],
    name: 'TradeClosed',
    type: 'event',
  },
  // openTrade function
  {
    name: 'openTrade',
    type: 'function',
    inputs: [
      { name: 'pairIndex', type: 'uint256' },
      { name: 'isLong', type: 'bool' },
      { name: 'collateral', type: 'uint256' },
      { name: 'leverage', type: 'uint256' },
      { name: 'tp', type: 'uint256' },
      { name: 'sl', type: 'uint256' },
    ],
    outputs: [],
  },
];

const USDT_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
];

interface TradeOpenedEvent {
  tradeHash: string;
  trader: string;
  pairIndex: number;
  isLong: boolean;
  collateral: string;
  leverage: string;
  openPrice: string;
  transactionHash: string;
  blockNumber: number;
}

interface TradeClosedEvent {
  tradeHash: string;
  trader: string;
  closePrice: string;
  pnl: string;
  closeType: number;
  transactionHash: string;
  blockNumber: number;
}

interface CopyTradeSettings {
  riskMultiplier: number;
  maxCollateralPerTrade: number;
  enabled: boolean;
}

class AsterDexService {
  private web3: Web3;
  private provider: ethers.providers.WebSocketProvider;
  private contract: any;
  private usdtContract: any;
  private eventSubscriptions: Map<string, any> = new Map();

  constructor() {
    this.web3 = new Web3(new Web3.providers.WebsocketProvider(BSC_WSS_RPC));
    this.provider = new ethers.providers.WebSocketProvider(BSC_WSS_RPC);
    this.contract = new this.web3.eth.Contract(ASTERDEX_ABI as any, ASTERDEX_ADDRESS);
    this.usdtContract = new this.web3.eth.Contract(USDT_ABI as any, USDT_ADDRESS);

    console.log('[AsterDEX] Service initialized with contract:', ASTERDEX_ADDRESS);
  }

  // Get USDT balance for an address
  async getUSDTBalance(address: string): Promise<number> {
    try {
      const balance = await this.usdtContract.methods.balanceOf(address).call();
      // USDT on BSC has 18 decimals
      return parseFloat(this.web3.utils.fromWei(balance, 'ether'));
    } catch (error) {
      console.error('[AsterDEX] Error fetching USDT balance:', error);
      return 0;
    }
  }

  // Subscribe to TradeOpened events for a specific trader
  subscribeToTraderTrades(
    traderAddress: string,
    onTrade: (event: TradeOpenedEvent) => void
  ): void {
    const subscription = this.contract.events.TradeOpened({
      filter: { trader: traderAddress },
    })
      .on('data', (event: any) => {
        const tradeEvent: TradeOpenedEvent = {
          tradeHash: event.returnValues.tradeHash,
          trader: event.returnValues.trader,
          pairIndex: parseInt(event.returnValues.pairIndex),
          isLong: event.returnValues.isLong,
          collateral: event.returnValues.collateral,
          leverage: event.returnValues.leverage,
          openPrice: event.returnValues.openPrice,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        };

        console.log(`[AsterDEX] TradeOpened by ${traderAddress}:`, tradeEvent);
        onTrade(tradeEvent);
      })
      .on('error', (error: Error) => {
        console.error(`[AsterDEX] Error subscribing to ${traderAddress}:`, error);
      });

    this.eventSubscriptions.set(`trade_${traderAddress}`, subscription);
  }

  // Subscribe to TradeClosed events
  subscribeToTradeClosed(
    tradeHash: string,
    onClose: (event: TradeClosedEvent) => void
  ): void {
    const subscription = this.contract.events.TradeClosed({
      filter: { tradeHash },
    })
      .on('data', (event: any) => {
        const closeEvent: TradeClosedEvent = {
          tradeHash: event.returnValues.tradeHash,
          trader: event.returnValues.trader,
          closePrice: event.returnValues.closePrice,
          pnl: event.returnValues.pnl,
          closeType: parseInt(event.returnValues.closeType),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        };

        console.log(`[AsterDEX] TradeClosed ${tradeHash}:`, closeEvent);
        onClose(closeEvent);
      })
      .on('error', (error: Error) => {
        console.error(`[AsterDEX] Error subscribing to trade close:`, error);
      });

    this.eventSubscriptions.set(`close_${tradeHash}`, subscription);
  }

  // Calculate mirrored trade parameters
  calculateMirroredTrade(
    originalTrade: TradeOpenedEvent,
    settings: CopyTradeSettings,
    userBalance: number
  ): {
    collateral: string;
    leverage: string;
    canExecute: boolean;
    reason?: string;
  } {
    if (!settings.enabled) {
      return { collateral: '0', leverage: '0', canExecute: false, reason: 'Copy trading disabled' };
    }

    const originalCollateral = parseFloat(this.web3.utils.fromWei(originalTrade.collateral, 'ether'));
    const scaledCollateral = originalCollateral * settings.riskMultiplier;

    // Check max collateral limit
    if (scaledCollateral > settings.maxCollateralPerTrade) {
      return {
        collateral: '0',
        leverage: '0',
        canExecute: false,
        reason: `Exceeds max collateral limit (${settings.maxCollateralPerTrade} USDT)`,
      };
    }

    // Check user balance
    if (scaledCollateral > userBalance) {
      return {
        collateral: '0',
        leverage: '0',
        canExecute: false,
        reason: `Insufficient balance (need ${scaledCollateral}, have ${userBalance})`,
      };
    }

    return {
      collateral: this.web3.utils.toWei(scaledCollateral.toString(), 'ether'),
      leverage: originalTrade.leverage,
      canExecute: true,
    };
  }

  // Generate transaction data for opening a mirrored trade
  generateOpenTradeData(
    pairIndex: number,
    isLong: boolean,
    collateral: string,
    leverage: string,
    tp: string = '0',
    sl: string = '0'
  ): string {
    const iface = new ethers.utils.Interface(ASTERDEX_ABI);
    return iface.encodeFunctionData('openTrade', [
      pairIndex,
      isLong,
      collateral,
      leverage,
      tp,
      sl,
    ]);
  }

  // Unsubscribe from events
  unsubscribe(key: string): void {
    const subscription = this.eventSubscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.eventSubscriptions.delete(key);
      console.log(`[AsterDEX] Unsubscribed from ${key}`);
    }
  }

  // Unsubscribe from all events
  unsubscribeAll(): void {
    this.eventSubscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
      console.log(`[AsterDEX] Unsubscribed from ${key}`);
    });
    this.eventSubscriptions.clear();
  }

  // Get recent trades for a trader (using event logs)
  async getRecentTrades(traderAddress: string, limit: number = 10): Promise<TradeOpenedEvent[]> {
    try {
      const currentBlock = await this.web3.eth.getBlockNumber();
      const fromBlock = currentBlock - 10000; // Last ~10k blocks (~8 hours on BSC)

      const events = await this.contract.getPastEvents('TradeOpened', {
        filter: { trader: traderAddress },
        fromBlock,
        toBlock: 'latest',
      });

      return events
        .slice(-limit)
        .map((event: any) => ({
          tradeHash: event.returnValues.tradeHash,
          trader: event.returnValues.trader,
          pairIndex: parseInt(event.returnValues.pairIndex),
          isLong: event.returnValues.isLong,
          collateral: event.returnValues.collateral,
          leverage: event.returnValues.leverage,
          openPrice: event.returnValues.openPrice,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        }));
    } catch (error) {
      console.error('[AsterDEX] Error fetching recent trades:', error);
      return [];
    }
  }

  // Subscribe to new blocks
  subscribeToBlocks(onBlock: (blockNumber: number) => void): void {
    this.web3.eth.subscribe('newBlockHeaders')
      .on('data', (blockHeader: any) => {
        onBlock(blockHeader.number);
      })
      .on('error', (error: Error) => {
        console.error('[AsterDEX] Block subscription error:', error);
      });
  }
}

export const asterDexService = new AsterDexService();
export type { TradeOpenedEvent, TradeClosedEvent, CopyTradeSettings };
