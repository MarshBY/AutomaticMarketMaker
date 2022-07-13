const hre = require("hardhat");

async function main() {
    //Deploy 2 ERC20s:
    const Token = await hre.ethers.getContractFactory("Token");
    const t1 = await Token.deploy("Token1", "T1");
    await t1.deployed();
    const t2 = await Token.deploy("Token2", "T2");
    await t2.deployed();

  // Deploy AMM
  const AMM = await hre.ethers.getContractFactory("AMM");
  const amm = await AMM.deploy(t1.address, t2.address);

  await amm.deployed();

  console.log("T1 deployed to:", t1.address);
  console.log("T2 deployed to:", t2.address);
  console.log("AMM deployed to:", amm.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
