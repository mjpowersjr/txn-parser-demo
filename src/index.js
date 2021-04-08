const { ethers } = require("ethers");
const { legos } = require('@studydefi/money-legos');
const { sleep } = require('./utils.js');
const FileCache = require('./FileCache.js');
const IUniswapV2ERC20 = require('@uniswap/v2-core/build/IUniswapV2ERC20.json');
const IUniswapV2Factory = require('@uniswap/v2-core/build/IUniswapV2Factory.json');
const IUniswapV2Pair = require('@uniswap/v2-core/build/IUniswapV2Pair.json');
const IUniswapV2Router02 = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json');
const path = require('path');
const process = require('process');

// setup cache
const CACHE_DIR = path.join(__dirname, '..', 'ethereum-cache');
const cache = new FileCache(CACHE_DIR);


// default provider uses public infrastructure nodes hosted by Infura
// requests are heavily throttled on public nodes
const REQUEST_RATE = 1 * 1000;

const provider = ethers.getDefaultProvider()


// combine multiple common ABIs into a single interface
const combinedAbi = [].concat(
    IUniswapV2ERC20.abi,
    IUniswapV2Factory.abi,
    IUniswapV2Pair.abi,
    IUniswapV2Router02.abi,
    legos.erc20.abi,
  );

const abiInterface = new ethers.utils.Interface(combinedAbi);


async function getBlock(blockNumber) {
    let blockData = null;
    const cacheKey = 'block.' + blockNumber;
    try {
        blockData = await cache.get(cacheKey);
    } catch(e) {
        // throttle requests to node
        await sleep(REQUEST_RATE); 

        blockData = await provider.getBlock(blockNumber);
        cache.set(cacheKey, blockData);
    }
    return blockData;
}

async function getTransaction(hash) {
    let transactionData = null;
    const cacheKey = 'txn.' + hash;
    try {
        transactionData = await cache.get(cacheKey);
    } catch(e) {
        // throttle requests to node
        await sleep(REQUEST_RATE); 

        transactionData = await provider.getTransaction(hash);
        cache.set(cacheKey, transactionData);
    }
    return transactionData;
}


async function main(args) {

    const blockNumbers = [
        1, // genesis block
        46147, // block with first txn
    ]

    // determine most recent block height
    const latestBlockNumber = await provider.getBlockNumber()

    // add recent blocks to queue
    for(let i = 0; i < 5; i++) {
        blockNumbers.push(latestBlockNumber - i);
    }

    for(const blockNumber of blockNumbers) {
        const block = await getBlock(blockNumber);
        await processBlock(block);
    }

}


async function processBlock(block) {

    console.log("----------------------------------------")
    console.log({block});
    console.log("----------------------------------------")
    
    for(const hash of block.transactions) {
        const transaction = await getTransaction(hash);
        await processTransaction(transaction);
    }
    console.log("----------------------------------------\n\n")

}

async function processTransaction(transaction) {
    console.log({transaction})

    // attempt to decode transaction data using ABI
    try {
        const decoded = abiInterface.parseTransaction(transaction);
        console.log({decoded});
    } catch (e) {
        // this will happen often, as we do not have the corresponding ABI for
        // many txns that are executed within a block.
        console.warn(`failed to decode transaction - hash: ${transaction.hash}; error: ${e}`)
    }
}



const args = process.argv.slice(2);

main(args).catch((e) => {
    console.error(e);
    process.exit(1);
})
