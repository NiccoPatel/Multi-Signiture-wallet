pragma solidity 0.8.3;
pragma abicoder v2;
import "./SafeMath.sol";


contract MultiSigWallet {

    using SafeMath for uint;

    mapping(address => bool) private owners;

    struct Transaction {
        address creator;
        address to;
        uint amount;
        uint approvals;
        string status;
    }

    Transaction[] private transactions;

    mapping(address => mapping(uint => bool)) signersMapping;

    uint public balance;

    uint private approvalLimit;

    modifier onlyOwner()  {
        require(owners[msg.sender] == true, "You do not have the privileges to carry out this function");
        _;
    }

    event deposited(uint);

    event transactionCreated(Transaction);

    event transferProcessed(address _to, uint _amount);


    constructor(address[] memory _owners, uint _approvalLimit){

        for(uint i=0; i < _owners.length; i++){
            owners[_owners[i]] = true;
        }

        approvalLimit = _approvalLimit;

    }


    function deposit() public payable returns(uint)  {
        require(msg.value > 0 ether, "You must send a non-zero ether amount");

        uint balanceBeforeChange = balance;

        balance = balance.add(msg.value);

        emit deposited(msg.value);

        assert(balance == balanceBeforeChange.add(msg.value));

        return balance;
    }

    function createTransaction(address _to, uint _amount) public onlyOwner{
        require(_amount > 0 ether, "You must send a non-zero ether amount");
        require(_amount <= balance, "The amount exceeds the total balance");

        Transaction memory _transaction;

        uint oldTransactionsSize = transactions.length;

        _transaction = Transaction({creator: msg.sender, to: _to, amount: _amount, approvals: 0 , status: "pending"});

        transactions.push(_transaction);

        emit transactionCreated(_transaction);

        assert(transactions.length == oldTransactionsSize + 1);

    }

    function approveTransaction(uint _index) public onlyOwner {
        require(msg.sender != transactions[_index].creator, "You are not allowed to approve your own transactions");
        require(transactions.length > 0, "There are no pending transactions to approve");
        require(keccak256(abi.encodePacked(transactions[_index].status)) == keccak256(abi.encodePacked("pending")), "The outcome of this transaction has already been settled");
        require(signersMapping[msg.sender][_index] == false, "The transaction can't be signed twice");

        signersMapping[msg.sender][_index] = true;
        transactions[_index].approvals = transactions[_index].approvals.add(1);

        if(transactions[_index].approvals >= approvalLimit){
            processTransaction(transactions[_index]);
        }

    }

    function processTransaction(Transaction storage transaction) private {
        require(transaction.amount <= balance, "The amount exceeds the total balance");

            uint balanceBeforeChange = balance;

            _transfer(transaction.to, transaction.amount);

            transaction.status = "approved";

        assert(balance == balanceBeforeChange.sub(transaction.amount));
    }

    function _transfer(address _to, uint _amount) private {
        balance = balance.sub(_amount);
        payable(_to).transfer(_amount);

        emit transferProcessed(_to, _amount);
    }

    function getOwner() public view returns(bool){
        return owners[msg.sender];

    }

    function getTransaction(uint _index) public view returns(Transaction memory) {
        return (transactions[_index]);
    }

}
