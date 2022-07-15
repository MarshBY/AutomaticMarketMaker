import { ethers } from "ethers";
import { erc20ABI } from "wagmi";
import constants from "../constants";

let tokenList = []; //{address, name}
let poolList = []; //address //Should do {address, token1address, token2address}?

const refreshList = async (provider) => {
    console.log('Getting token list...');

    const filter = {
        address: constants.contract,
        topics: [
            ethers.utils.id('PoolCreated(address,address,address)'),
        ],
        fromBlock: constants.fromBlock
    }

    const logs = await provider.getLogs(filter);

    console.log('Logs', logs);

    let tokens = logs.reduce((acc, log) => acc.concat([
        ethers.utils.defaultAbiCoder.decode(['address'], log.topics[2])[0], //Token1
        ethers.utils.defaultAbiCoder.decode(['address'], log.topics[3])[0]] //Token2
    ), []);

    
    //TODO remove token duplicates
    tokens = tokens.filter((t, i) => tokens.indexOf(t) === i);
    
    tokens = await Promise.all(tokens.map(async (token) => {
        const erc20 = new ethers.Contract(token, erc20ABI, provider);
        
        const name = await erc20.name();
        return { address: token, name: name }
    }))
    
    const pools = logs.map(log =>
        ethers.utils.defaultAbiCoder.decode(['address'], log.topics[1])[0] //Pool address
    );
    
    //console.log('Tokens: ', tokens);
    console.log('Pools: ', pools);

    tokenList = tokens;
    poolList = pools;
}

const getTokenList = async (provider) => {
    if (tokenList.length > 0) {
        return tokenList;
    }
    //Get tokenlist for the first time
    await refreshList(provider);
    return tokenList;
}

const getPoolList = async (provider) => {
    if(poolList.length > 0) {
        return poolList;
    }
    //Get for first time
    await refreshList(provider);
    return poolList;
}

const addToken = (token) => {
    if(tokenList.filter(t => t.address == token.address).length > 0) return;
    tokenList.push(token);
}


export { getTokenList, getPoolList, refreshList, addToken };