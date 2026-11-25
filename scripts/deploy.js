const hre = require("hardhat");

async function main() {
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log("Voting deployed to:", address);

  const options = ["Да", "Нет", "Воздержался"];

  for (const option of options) {
    const tx = await voting.addOption(option);
    await tx.wait();
    console.log(`Added option: ${option}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
