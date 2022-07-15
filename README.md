# AutomaticMarketMaker

This is my attempt to create a DEX using the AMM constant product formula. I coded the Smart Contracts as well as the full frontend React app that interacts with them,
the AMMs hold two ERC20 tokens as a liquidity pool. Users can Swap, Add Liquidity which provides them with LP ERC20 Tokens, and Remove Liquidity using those tokens.

At the moment I haven't implemented fees for Liquidity Providers but will very soon.

If you want to use a hosted version of the frontend, find it at https://automaticmm.herokuapp.com/ . Though you'll have to start a local evm blockchain and deploy the
contracts in it to make it work (Because deploying in a testnet would require big amounts of ERC20, so I didn't deploy any pools).
Got to [Starting the backend](#starting-the-backend)

## How it works (Smart Contracts)

For the Smart Contract side, there are two contracts. `AMM` and `AMMFactory`. The first one being the pool itself, and the second one being a deployer of new pools.

### AMM contract

It's a contract that extends the OpenZeppelin's `ERC20` contract in order to be able to mint, burn, transfer, etc. the LP tokens to track how much liquidity each user has deposited.

It has the main functions which include `swap`, `addLiquidity`, `removeLiquidity`. As well as functions to help the frontend calculate exchange rates such as 
`expectOut` which returns how much of the other amount you can expect. And `requiredAmount` which returns how much tokens are required of the other token when adding liquidity.

Some of these functions take a bool `_direction` as an argument. This argument dictates the direction in which the calculations or swaps are done. Where:

`True` being Token 1 -> Token 2

`False` being Token 2 -> Token 1

### AMMFactory contract

It has a public mapping `pools` which stores the addresses of all created pools. It maps both ways each token's address. Meaning that `pools(token1.address, token2.address)` whill return the same as `pools(token2.address, token1.address)`

Then it has a function `createPool` which takes the two tokens' addresses as arguments and emits a log `PoolCreated`


## Cloning

The repository is divided into two folders, blockchain and frontend. For each directory you're going to use, install dependencies (after changing directory `cd directory/`

    npm i

### Starting the backend

First change the directory to backend, and then start the hardhat node

    cd backend/
    npx hardhat node
    
Then deploy the contracts, the `deploy.js` file deploys 3 ERC20 tokens as well as the AMMFactory and an AMMPool with Token1 and Token2, though no liquidity is provided.

    npx hardhat run --network localhost scripts/deploy.js
    
### Starting the frontend

Change to the frontend directory, and start the dev server using the create-react-app script

    cd frontend/
    npm start
    
If it doesn't do it automatically, go to `localhost:3000` in your browser.

Connect your metamask or whichever wallet you want to localhost blockchain network and use one of the provided wallets by hardhat (when you did `npx hardhat node`).
