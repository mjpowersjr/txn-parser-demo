import IUniswapV2Router02 from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import IUniswapV2Factory from '@uniswap/v2-core/build/IUniswapV2Factory.json';
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json';
import IUniswapV2ERC20 from '@uniswap/v2-core/build/IUniswapV2ERC20.json';
import { legos } from '@studydefi/money-legos';
import ethers from 'ethers';
import * as rlp from 'rlp';

/**
 * Collector -> redis
 *
 * decoder
 *
 * address characterizer
 *
 * speculative executor -> decoder
 *
 *
 * https://github.com/trufflesuite/ganache-core/blob/8a7ba780a664e32b2210e32c3bfebe359e7cfc37/src/chains/ethereum/ethereum/src/blockchain.ts
 */

export default class TransactionParser {
  constructor() {
    const combinedAbi = [].concat(
      IUniswapV2ERC20.abi,
      IUniswapV2Factory.abi,
      IUniswapV2Pair.abi,
      IUniswapV2Router02.abi,
      // legos.aave.,
      // legos.balancer.abi,
      // legos.compound.abi,
      // legos.curvefi.abi,
      // legos.dydx.abi,
      legos.erc20.abi,
      // legos.idle.abi,
      // legos.kyber.abi,
      // legos.maker.abi,
      // legos.mstable.abi,
      // legos.onesplit.abi,
      // legos.synthetix.abi,
      // legos.uniswap.abi,
    );

    const abiInterface = new ethers.utils.Interface(combinedAbi);
    this.abiInterface = abiInterface;
  }

  parse(data) {
    // FIXME: it's not clear if ethers is verifying txn signatures...
    // FIXME - devp2p decodes the RLP payload, but ethers expects it to be encoded...
    // https://github.com/ethers-io/ethers.js/blob/6c43e20e7a68f3f5a141c74527ec63d9fe8458be/packages/transactions/src.ts/index.ts#L165
    // https://github.com/ethereumjs/ethereumjs-devp2p/blob/41a7cc28534e6eaceee6bbfa3e63d38184a7d778/src/eth/index.ts#L60
    const encoded = rlp.encode(data);

    const transaction = ethers.utils.parseTransaction(encoded);
    return transaction;
  }

  decode(transaction) {
    let parsedTransaction;

    try {
      parsedTransaction = this.abiInterface.parseTransaction(transaction);
    } catch (e) {
    }

    return parsedTransaction;
  }

  log(transaction, decoded) {

    // const functionName = decoded ? decoded.name

  }
}
