const { Blockchain, Transaction } = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('d66e408456200af402e111196e99b14efa011afa7f5cef0830eb19aae3496e35');
const myWalletAddress= myKey.getPublic('hex');


let liraCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, 'public key here', 10);
tx1.signTransaction(myKey);
liraCoin.addTransaction(tx1);

// now start the miner to create a block for them to be stored on blockchain
console.log('\n Starting the miner...');
liraCoin.minePendingTransactions(myWalletAddress);

// balance will be 90, after mining block youre at 100, then 10 is subtracted from the balance
console.log(
  '\nBalance for josh is',
  liraCoin.getBalanceOfAddress(myWalletAddress)
);

// liraCoin.chain[1].transactions[0].amount = 1; // signature won't matchup if you leave this here

console.log('is chain valid?', liraCoin.isChainValid());
