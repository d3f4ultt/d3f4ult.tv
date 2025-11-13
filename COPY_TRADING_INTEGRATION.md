# AsterDEX Copy Trading Integration

This document outlines the complete copy trading integration with AsterDEX smart contracts on Binance Smart Chain (BSC).

## Overview

The copy trading system allows users to automatically mirror trades from successful traders on AsterDEX. It includes:

- **Real-time Event Listening**: WebSocket subscriptions to BSC blockchain events
- **Automated Trade Mirroring**: Automatic replication of followed traders' positions
- **Risk Management**: Configurable risk multipliers and position sizing
- **Portfolio Tracking**: Live portfolio allocation and performance monitoring
- **Safety Features**: Balance checks, maximum collateral limits, and user approval requirements

## Architecture

### Backend Components

1. **AsterDEX Service** (`server/services/asterDexService.ts`)
   - Connects to BSC via WebSocket RPC
   - Subscribes to `TradeOpened` and `TradeClosed` events
   - Calculates mirrored trade parameters based on user settings
   - Validates balances and risk limits

2. **API Routes** (`server/routes.ts`)
   - Trader leaderboard endpoints
   - User follow/unfollow management
   - Copy trading settings (risk multiplier, max collateral)
   - Recent trades history
   - WebSocket server for real-time events

3. **WebSocket Server**
   - Path: `/copytrading`
   - Broadcasts trade events to subscribed clients
   - Auto-reconnection on disconnect
   - Room-based filtering per user wallet

### Frontend Components

1. **Copy Trading Page** (`client/src/pages/CopyTrading.tsx`)
   - Main dashboard for copy trading
   - Portfolio overview cards
   - Integration point for all sub-components

2. **Trader Leaderboard** (`client/src/components/copytrading/TraderLeaderboard.tsx`)
   - Top traders ranked by ROI
   - Performance metrics (win rate, volume, followers)
   - Follow/unfollow buttons

3. **Portfolio Chart** (`client/src/components/copytrading/PortfolioChart.tsx`)
   - Area chart showing portfolio value over time
   - 6-month historical data
   - Responsive with theme integration

4. **Copy Trading Status** (`client/src/components/copytrading/CopyTradingStatus.tsx`)
   - Risk management settings
   - Portfolio allocation pie chart
   - Recent mirrored trades list
   - Real-time WebSocket connection status

5. **Followed Traders** (`client/src/components/copytrading/FollowedTraders.tsx`)
   - Grid of traders you're copying
   - Individual trader performance
   - Unfollow functionality

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# BSC RPC Endpoints (provided by DRPC)
BSC_HTTP_RPC=https://lb.drpc.org/ogrpc?network=bsc&dkey=AsGUZ98Ja0v8psqFQO9c7SFP1HZosp8R8LzKQrxF2MGT
BSC_WSS_RPC=wss://lb.drpc.org/ogWebSockets?network=bsc&dkey=AsGUZ98Ja0v8psqFQO9c7SFP1HZosp8R8LzKQrxF2MGT

# AsterDEX Contract Address (BSC Mainnet)
ASTERDEX_CONTRACT=0x1b6F2d3844C6ae7D56ceb3C3643b9060ba28FEb0

# USDT Contract Address (BSC Mainnet)
USDT_CONTRACT=0x55d398326f99059fF775485246999027B3197955
```

## Smart Contract Integration

### AsterDEX Trading Contract

**Address**: `0x1b6F2d3844C6ae7D56ceb3C3643b9060ba28FEb0` (BSC Diamond Proxy)

### Key Events

```solidity
event TradeOpened(
    bytes32 indexed tradeHash,
    address indexed trader,
    uint256 pairIndex,
    bool isLong,
    uint256 collateral,
    uint256 leverage,
    uint256 openPrice
);

event TradeClosed(
    bytes32 indexed tradeHash,
    address indexed trader,
    uint256 closePrice,
    int256 pnl,
    uint8 closeType
);
```

### Functions

```solidity
function openTrade(
    uint256 pairIndex,
    bool isLong,
    uint256 collateral,
    uint256 leverage,
    uint256 tp,  // Take profit
    uint256 sl   // Stop loss
) external;
```

## Copy Trading Flow

### 1. User Follows a Trader

```typescript
POST /api/copytrading/user/:walletAddress/follow
Body: { traderAddress: "0x..." }
```

- Saves trader to user's followed list
- Backend subscribes to trader's `TradeOpened` events
- Frontend updates UI to show followed trader

### 2. Trader Opens Position

- AsterDEX emits `TradeOpened` event
- Backend receives event via WebSocket
- Event contains: pair, direction, collateral, leverage, price

### 3. Automated Trade Mirroring

```typescript
// Calculate mirrored parameters
const mirroredTrade = asterDexService.calculateMirroredTrade(
  originalTrade,
  userSettings,
  userBalance
);

if (mirroredTrade.canExecute) {
  // Generate transaction data
  const txData = asterDexService.generateOpenTradeData(
    pairIndex,
    isLong,
    mirroredTrade.collateral,
    mirroredTrade.leverage
  );

  // Broadcast to user's frontend for signing
  ws.send({
    type: 'trade_mirror_request',
    data: {
      to: ASTERDEX_ADDRESS,
      data: txData,
      value: 0
    }
  });
}
```

### 4. User Approval & Execution

- Frontend receives mirror request via WebSocket
- User's wallet prompts for transaction approval
- Transaction executed on-chain
- Position opened on AsterDEX
- UI updated with new mirrored trade

### 5. Position Tracking

- Backend subscribes to `TradeClosed` for mirrored trades
- PnL calculated when position closes
- Real-time updates via WebSocket
- Portfolio chart updated

## Risk Management

### User Settings

```typescript
interface CopySettings {
  riskMultiplier: number;        // 0.1 to 2.0 (10% to 200%)
  maxCollateralPerTrade: number; // Max USDT per position
  enabled: boolean;              // Master on/off switch
}
```

### Safety Checks

1. **Balance Verification**
   ```typescript
   const userBalance = await asterDexService.getUSDTBalance(userWallet);
   if (scaledCollateral > userBalance) {
     // Reject trade - insufficient funds
   }
   ```

2. **Collateral Limit**
   ```typescript
   if (scaledCollateral > settings.maxCollateralPerTrade) {
     // Reject trade - exceeds max
   }
   ```

3. **Enable Check**
   ```typescript
   if (!settings.enabled) {
     // Skip all trade mirroring
   }
   ```

4. **Approval Required**
   - All transactions require user wallet signature
   - No automated execution without user consent
   - Users can review each trade before confirming

## WebSocket Protocol

### Client Connection

```typescript
const ws = new WebSocket('ws://localhost:3000/copytrading');

ws.onopen = () => {
  // Subscribe to events
  ws.send(JSON.stringify({
    type: 'subscribe',
    walletAddress: '0x...'
  }));
};
```

### Server Messages

```typescript
// Connection confirmed
{
  type: 'connected',
  message: 'Connected to copy trading events'
}

// Trade mirrored
{
  type: 'trade_mirrored',
  data: {
    tradeHash: '0x...',
    timestamp: '2025-01-13T...',
    pairIndex: 1,
    isLong: true,
    collateral: '100.00',
    leverage: '10',
    status: 'open',
    pnl: 0
  }
}

// Position closed
{
  type: 'trade_closed',
  data: {
    tradeHash: '0x...',
    closePrice: '50000.00',
    pnl: 25.50
  }
}
```

## Testing

### Mock Data

Current implementation uses mock trader data for testing:

```typescript
const mockTraders = [
  {
    address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    roi: 45.8,
    winRate: 78.5,
    trades: 156,
    totalVolume: 245000,
    followers: 342
  },
  // ...
];
```

### Live Testing

1. Connect Solana wallet (currently using Solana, will integrate BSC)
2. Navigate to `/copy-trading`
3. Enable copy trading in settings
4. Follow a trader from the leaderboard
5. Wait for simulated trade events (every 5s, 5% probability)

## Production Deployment

### Required Changes

1. **Replace Mock Data**
   - Connect to AsterDEX subgraph for real trader data
   - Use actual contract event logs

2. **Database Integration**
   - Store user settings persistently
   - Track followed traders per user
   - Log all mirrored trades for history

3. **Wallet Integration**
   - Add BSC wallet support (MetaMask, Trust Wallet)
   - Implement proper transaction signing flow
   - Add Solana/BSC bridge if needed

4. **Security**
   - Never store private keys
   - Use relayer pattern or Gelato Network for automation
   - Implement rate limiting on API endpoints
   - Add CORS restrictions

5. **Monitoring**
   - Log all contract events
   - Alert on failed trade attempts
   - Track success rate of mirrored trades
   - Monitor WebSocket connection health

## API Reference

### Get Top Traders
```
GET /api/copytrading/traders
Response: Array<Trader>
```

### Get User Data
```
GET /api/copytrading/user/:walletAddress
Response: UserData
```

### Follow Trader
```
POST /api/copytrading/user/:walletAddress/follow
Body: { traderAddress: string }
Response: { success: boolean }
```

### Get Copy Settings
```
GET /api/copytrading/user/:walletAddress/settings
Response: CopySettings
```

### Update Copy Settings
```
POST /api/copytrading/user/:walletAddress/settings
Body: CopySettings
Response: { success: boolean, settings: CopySettings }
```

### Get Recent Trades
```
GET /api/copytrading/user/:walletAddress/trades
Response: Array<MirroredTrade>
```

### Get Portfolio History
```
GET /api/copytrading/user/:walletAddress/portfolio-history
Response: Array<{ date: string, value: number }>
```

## Troubleshooting

### WebSocket Not Connecting

- Check BSC_WSS_RPC environment variable
- Verify network connectivity
- Check browser console for errors
- Ensure WebSocket port is not blocked

### Events Not Received

- Verify AsterDEX contract address
- Check event subscription in asterDexService
- Monitor backend logs for event reception
- Confirm trader has actually made trades

### Trades Not Mirroring

- Check user copy settings (enabled = true)
- Verify sufficient USDT balance
- Check collateral doesn't exceed max limit
- Ensure user approved the transaction

## Future Enhancements

1. **Multi-Chain Support**
   - Add support for other EVM chains
   - Cross-chain position mirroring

2. **Advanced Risk Management**
   - Per-trader risk limits
   - Portfolio-level exposure limits
   - Dynamic position sizing

3. **Performance Analytics**
   - Track ROI per followed trader
   - Compare personal vs. trader performance
   - Export trade history

4. **Social Features**
   - Trader profiles and stats
   - Community ratings and reviews
   - Social feed of recent trades

5. **Automation Improvements**
   - Gelato Network integration for gasless execution
   - Batch trade execution
   - Conditional order mirroring

## Support

For issues or questions:
- Check logs: `server/` backend logs
- Browser console: Frontend WebSocket logs
- AsterDEX docs: https://docs.asterdex.com/
- BSC Scan: https://bscscan.com/
