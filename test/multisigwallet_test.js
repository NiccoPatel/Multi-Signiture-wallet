const MultiSigWallet = artifacts.require("MultiSigWallet");
const truffleAssert = require("truffle-assertions");


contract("MultiSigWallet", async function(accounts){

  let owners = [accounts[0], accounts[1], accounts[2], accounts[3]];
  let APPROVAL_LIMIT = 2;

  let instance;

  before(async function(){
    instance = await MultiSigWallet.new(owners, APPROVAL_LIMIT);

    console.log(accounts[0]);
    console.log(accounts[1]);
    console.log(accounts[2]);
  });


describe('Depositing', function(){

  it("should allow any non-owner to deposit into the wallet", async function(){
    await truffleAssert.passes(instance.deposit({value: web3.utils.toWei("0.2", "ether") ,from: accounts[5]}), truffleAssert.ErrorType.REVERT);
  });

  it("should allow any owner to deposit into the wallet", async function(){
    await truffleAssert.passes(instance.deposit({value: web3.utils.toWei("0.2", "ether") ,from: accounts[1]}), truffleAssert.ErrorType.REVERT);
  });

});

describe('Transaction Creation', function(){

  it("shouldn't create a transaction when amount < balance", async function(){
    let tempInstance = await MultiSigWallet.new(owners, APPROVAL_LIMIT);
    await truffleAssert.fails(tempInstance.createTransaction(accounts[5] ,10000, {from: accounts[1]}), truffleAssert.ErrorType.REVERT);
  });

  it("shouldn't allow a non-owner to create a transaction", async function(){
    let tempInstance = await MultiSigWallet.new(owners, APPROVAL_LIMIT);
    tempInstance.deposit({value: web3.utils.toWei("4", "ether") ,from: accounts[7]});

    await truffleAssert.fails(tempInstance.createTransaction(accounts[6], web3.utils.toWei("0.2", "ether"), {from: accounts[4]}), truffleAssert.ErrorType.REVERT);
  });

  it("should allow any owner to create a transaction", async function(){
    await truffleAssert.passes(instance.createTransaction(accounts[6], web3.utils.toWei("0.1", "ether"), {from: accounts[0]}), truffleAssert.ErrorType.REVERT);
  });

});

describe('Transaction Approval/Processing', function(){
  it("shouldn't allow the creator of the transaction to approve their own transaction", async function(){
      await truffleAssert.fails(instance.approveTransaction(0,{from: accounts[0]}), truffleAssert.ErrorType.REVERT);
  });

  it("shouldn't allow any non-owner to approve a transaction", async function(){
    await truffleAssert.fails(instance.approveTransaction(0,{from: accounts[5]}), truffleAssert.ErrorType.REVERT);
  });

  it("should allow an owner and non-creator to approve a transaction", async function(){
    await truffleAssert.passes(instance.approveTransaction(0,{from: accounts[1]}), truffleAssert.ErrorType.REVERT);
  });

  it("shouldn't allow any same owner and non-creator to approve a transaction twice", async function(){
    await truffleAssert.fails(instance.approveTransaction(0,{from: accounts[1]}), truffleAssert.ErrorType.REVERT);
  });

  it("should process the transaction when approvals == 2", async function(){

    let oldBalance = await instance.balance.call();
    let approveTransaction = await instance.approveTransaction(0,{from: accounts[2]});
    let transaction = await instance.getTransaction(0, {from: accounts[0]});

    let newBalance = await instance.balance.call();

    assert(transaction.status == "approved" && newBalance == oldBalance - transaction.amount, "Transaction final balance is incorrect");
  });

  it("shouldn't allow any owner to approve an already 'approved' transaction", async function(){
    await truffleAssert.fails(instance.approveTransaction(0,{from: accounts[1]}), truffleAssert.ErrorType.REVERT);
  });
})




});
