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

const provider = new ethers.providers.InfuraProvider();


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
        blockData =JSON.parse(await cache.get(cacheKey));
    } catch(e) {
        // throttle requests to node
        await sleep(REQUEST_RATE); 

        blockData = await provider.getBlock(blockNumber);
        await cache.set(cacheKey, JSON.stringify(blockData, null, 2));
    }
    return blockData;
}

async function getTransaction(hash) {
    let transactionData = null;
    const cacheKey = 'txn.' + hash;
    try {
        transactionData = JSON.parse(await cache.get(cacheKey));
        // TODO: it seems that public nodes no longer return the raw RLP encoded transaction data
        // raw txns are hex strings of RLP encoded data
        // const rawTransaction = await cache.get(cacheKey);
        // transactionData = ethers.utils.parseTransaction(rawTransaction);
    } catch(e) {
        // throttle requests to node
        await sleep(REQUEST_RATE); 

        transactionData = await provider.getTransaction(hash);
        // await cache.set(cacheKey, transactionData.raw);
        await cache.set(cacheKey,JSON.stringify(transactionData));
    }
    return transactionData;
}

async function processRecentBlocks(max) {

    // determine most recent block height
    const latestBlockNumber = await provider.getBlockNumber()

    // add recent blocks to queue
    for(let i = 0; i < max; i++) {
        const blockNumber = latestBlockNumber - i;
        const block = await getBlock(blockNumber);
        await processBlock(block);
    }
}


async function main(args) {

    const arg = args.shift();

    if (arg && arg.startsWith('0x')) {
        const transaction = await getTransaction(arg);
        await processTransaction(transaction);
    } else if (arg && Number.parseInt(arg)) {
        const block = await getBlock(arg);
        await processBlock(block);
    } else {
        // genesis block
        await processBlock(1);

        // first block with a txn
        await processBlock(46147);

        // a few recent blocks
        await processRecentBlocks(5); 
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
