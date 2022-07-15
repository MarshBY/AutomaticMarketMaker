const hre = require("hardhat");

async function main() {
  //Deploy 2 ERC20s:
  const Token = await hre.ethers.getContractFactory("Token");
  const t1 = await Token.deploy("Token1", "T1");
  await t1.deployed();
  const t2 = await Token.deploy("Token2", "T2");
  await t2.deployed();
  
  // Deploy AMM
  const AMMFactory = await hre.ethers.getContractFactory("AMMFactory");
  const amm = await AMMFactory.deploy();
  
  await amm.deployed();
  
  const t3 = await Token.deploy("Token3", "T3");
  await t3.deployed();

  const tx = await amm.createPool(t1.address, t2.address);
  await tx.wait();

  console.log("T1 deployed to:", t1.address);
  console.log("T2 deployed to:", t2.address);
  console.log("AMMFactory deployed to:", amm.address);
  console.log("T3 deployed to:", t3.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
