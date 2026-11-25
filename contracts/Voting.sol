// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Option {
        string name;
        uint voteCount;
    }

    address public owner;
    Option[] public options;
    mapping(address => bool) public hasVoted;
    bool public votingOpen = true;

    event OptionAdded(uint indexed id, string name);
    event Voted(address indexed voter, uint indexed optionId);
    event VotingEnded(uint winnerId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier whenOpen() {
        require(votingOpen, "Voting is closed");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addOption(string memory name) external onlyOwner whenOpen {
        require(bytes(name).length > 0, "Empty name");
        options.push(Option(name, 0));
        emit OptionAdded(options.length - 1, name);
    }

    function vote(uint optionId) external whenOpen {
        require(!hasVoted[msg.sender], "Already voted");
        require(optionId < options.length, "No such option");

        hasVoted[msg.sender] = true;
        options[optionId].voteCount += 1;

        emit Voted(msg.sender, optionId);
    }

    function endVoting() external onlyOwner whenOpen {
        require(options.length > 0, "No options");
        votingOpen = false;

        (uint winnerId, ) = getWinner();
        emit VotingEnded(winnerId);
    }

    function getOptions() external view returns (Option[] memory) {
        return options;
    }

    function getOptionsCount() external view returns (uint) {
        return options.length;
    }

    function getWinner() public view returns (uint winnerId, string memory winnerName) {
        require(!votingOpen, "Voting is not finished");
        require(options.length > 0, "No options");

        uint maxVotes = 0;
        uint winner = 0;

        for (uint i = 0; i < options.length; i++) {
            if (options[i].voteCount > maxVotes) {
                maxVotes = options[i].voteCount;
                winner = i;
            }
        }

        return (winner, options[winner].name);
    }
}
