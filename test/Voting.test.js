const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let voting;
  let owner;
  let voter1;
  let voter2;

  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();

    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  it("owner adds an option and OptionAdded is emitted", async function () {
    await expect(voting.addOption("Yes"))
      .to.emit(voting, "OptionAdded")
      .withArgs(0, "Yes");

    expect(await voting.getOptionsCount()).to.equal(1);

    const options = await voting.getOptions();
    expect(options[0].name).to.equal("Yes");
    expect(options[0].voteCount).to.equal(0);
  });

  it("non-owner cannot add an option", async function () {
    await expect(voting.connect(voter1).addOption("No"))
      .to.be.revertedWith("Only owner");
  });

  it("user votes and the counter increases", async function () {
    await voting.addOption("Yes");

    await expect(voting.connect(voter1).vote(0))
      .to.emit(voting, "Voted")
      .withArgs(voter1.address, 0);

    const options = await voting.getOptions();
    expect(options[0].voteCount).to.equal(1);
    expect(await voting.hasVoted(voter1.address)).to.equal(true);
  });

  it("the same address cannot vote twice", async function () {
    await voting.addOption("Yes");
    await voting.connect(voter1).vote(0);

    await expect(voting.connect(voter1).vote(0))
      .to.be.revertedWith("Already voted");
  });

  it("voting for a nonexistent option is rejected", async function () {
    await voting.addOption("Yes");

    await expect(voting.connect(voter1).vote(5))
      .to.be.revertedWith("No such option");
  });

  it("after endVoting nobody can vote or add options and getWinner returns the winner", async function () {
    await voting.addOption("Yes");
    await voting.addOption("No");

    await voting.connect(voter1).vote(1);
    await voting.connect(voter2).vote(1);

    await expect(voting.endVoting())
      .to.emit(voting, "VotingEnded")
      .withArgs(1);

    expect(await voting.votingOpen()).to.equal(false);

    await expect(voting.connect(voter1).vote(0))
      .to.be.revertedWith("Voting is closed");
    await expect(voting.addOption("Maybe"))
      .to.be.revertedWith("Voting is closed");

    const [winnerId, winnerName] = await voting.getWinner();
    expect(winnerId).to.equal(1);
    expect(winnerName).to.equal("No");
  });

  it("returns the first leader when the votes are equal", async function () {
    await voting.addOption("A");
    await voting.addOption("B");

    await voting.connect(voter1).vote(0);
    await voting.connect(voter2).vote(1);

    await voting.endVoting();

    const [winnerId, winnerName] = await voting.getWinner();
    expect(winnerId).to.equal(0);
    expect(winnerName).to.equal("A");
  });

  it("rejects an empty option name", async function () {
    await expect(voting.addOption(""))
      .to.be.revertedWith("Empty name");
  });

  it("only the owner can end voting", async function () {
    await voting.addOption("A");

    await expect(voting.connect(voter1).endVoting())
      .to.be.revertedWith("Only owner");
  });

  it("getWinner reverts while voting is open", async function () {
    await voting.addOption("A");

    await expect(voting.getWinner())
      .to.be.revertedWith("Voting is not finished");
  });
});
