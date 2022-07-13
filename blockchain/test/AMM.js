const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AMM", () => {
    let amm, token1, token2;
    let signers;

    before(async () => {
        signers = await ethers.getSigners();
        const tokenDeployer = await ethers.getContractFactory("Token");
        token1 = await tokenDeployer.deploy("Token1", "T1");
        await token1.deployed()
        await token1.transfer(signers[1].address, ethers.utils.parseEther('1000'))
        //await token1._mint(signers[0].address, ethers.utils.parseEther('10000'));
        token2 = await tokenDeployer.deploy("Token2", "T2");
        await token2.transfer(signers[1].address, ethers.utils.parseEther('1000'))
        await token2.deployed()
        //await token2._mint(signers[0].address, ethers.utils.parseEther('10000'));
        const AMMDeployer = await ethers.getContractFactory("AMM");
        amm = await AMMDeployer.deploy(token1.address, token2.address);
        await amm.deployed();
    })

    describe('Proper deployment', async () => {
        it('Deploys', () => {
            expect(amm.address).to.not.be.eq(ethers.constants.AddressZero);
        });
        it('Has the proper tokens', async () => {
            expect(await amm.token1()).to.be.eq(token1.address);
            expect(await amm.token2()).to.be.eq(token2.address);
        })
        it('Has 0 LP tokens', async () => {
            expect(await amm.totalSupply()).to.be.eq(0);
        })
    })

    describe('Liquidity adding', async () => {
        it('Able to add Liquidity', async () => {
            await token1.approve(amm.address, ethers.utils.parseEther('200'));
            await token2.approve(amm.address, ethers.utils.parseEther('500'));
            expect(await amm.reserves1()).to.be.eq(0);
            await expect(amm.addLiquidity(ethers.utils.parseEther('200'), ethers.utils.parseEther('500'))).to.not.be.reverted;

            expect(ethers.utils.formatEther(await amm.totalSupply()).toString()).to.be.eq('316.227766016837933199');
            expect(ethers.utils.formatEther(await amm.balanceOf(signers[0].address)).toString()).to.be.eq('316.227766016837933199');
        })

        it('Able to add second Liquidity', async () => {
            await token1.connect(signers[1]).approve(amm.address, ethers.utils.parseEther('400'));
            await token2.connect(signers[1]).approve(amm.address, ethers.utils.parseEther('1000'));
            expect(await amm.reserves1()).to.be.eq(ethers.utils.parseEther('200'));
            const prevLP = await amm.totalSupply();
            //console.log('PrevLP', ethers.utils.formatEther(prevLP))
            const reserves1 = await amm.reserves1();
            await expect(amm.connect(signers[1]).addLiquidity(ethers.utils.parseEther('400'), ethers.utils.parseEther('1000'))).to.not.be.reverted;

            //console.log('New supply', ethers.utils.formatEther(await amm.totalSupply()));
            const LPtokens = prevLP.mul(ethers.utils.parseEther('400').div(reserves1));
            //console.log('New LP', LPtokens);
            expect(await amm.totalSupply()).to.be.eq(LPtokens.add(prevLP));
            expect(await amm.balanceOf(signers[1].address)).to.be.eq(LPtokens);
        })
    })
})