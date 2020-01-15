const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
  /**
   * 
   * @param {string} fromAddress 
   * @param {string} toAddress 
   * @param {number} amount 
   */
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  calculateHash() {
    return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
  }

  signTransaction(signingKey) {
    // can only spend coins you have the private key for
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('You cannot sign transactions for other wallets!');
    }

    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    this.signature = sig.toDER('hex');
  }

  isValid() {
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction.');
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');

    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.timestamp = timestamp;
    this.transactions = transactions; 	// data for the transaction taking place
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0; 										// random number that doesn't have to do with block itself
  }

  calculateHash() {
    return SHA256(
      this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce
    ).toString();
  }

  /**
   * Proof of work mechanism to create block. Loop keeps running until hash has enough zeros.
   * @param {*} difficulty amount of zeros a hash will be padded with
   */
  mineBlock(difficulty) {
    while (
      // runs as long as: first characters in hash from 0 to difficulty doesn't equal an array filled with zeroes that is the length of difficult
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')
    ) {
      this.nonce++; 											// incremented as long as hash doesn't start with enough zeroes
      this.hash = this.calculateHash(); 	// set new hash
    }

    console.log('Block mined: ' + this.hash);
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }

    return true;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()]; 	// init blockchain with first block
    this.difficulty = 4; 												// amount of zeroes when mining a coin
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  createGenesisBlock() {
    return new Block('22/12/2019', 'Genesis block', '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);

    console.log('Block successfully mined!');
    this.chain.push(block);

    this.pendingTransactions = [];
    // new Transaction(null, miningRewardAddress, this.miningReward)
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address.');
    }

    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain.');
    }
    this.pendingTransactions.push(transaction);
  }

  /**
   * Have to loop over all transactions for your address to see your "balance"
   */
  getBalanceOfAddress(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        // From address -> reduce your balance
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }
        // To address -> add to your balance
        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (!current.hasValidTransactions()) {
        return false;
      }

      if (current.hash !== current.calculateHash()) {
        return false;
      }
      // current doesn't point to previous block but rather something that doesn't exist
      if (current.previousHash !== previous.hash) {
        return false;
      }
    }
    return true;
  }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;