import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("RedsCoin Contract", function () {
  const initialSupply = 100;
  let RedsCoin;
  let owner;
  let hardhatToken;
  let user1;
  let user2;
  let users;

  beforeEach(async function () {
    [owner, user1, user2, ...users] = await ethers.getSigners();
    RedsCoin = await ethers.getContractFactory("RedsCoin");

    hardhatToken = await RedsCoin.deploy(initialSupply);
  });

  describe("Test the initial value of the contract", function () {
    it("should have the right name", async function () {
      expect(await hardhatToken.name()).to.equal("Reds Coin");
    });

    it("should have the right symbol", async function () {
      expect(await hardhatToken.symbol()).to.equal("REDS");
    });

    it("should reserve half of the supply for the future", async function () {
      expect(await hardhatToken.totalReservedSupply()).to.equal(
        (await hardhatToken.totalSupply()) / 2
      );
    });

    it("should have half of the supply open for trade", async function () {
      expect(await hardhatToken.openSupply()).to.equal((await hardhatToken.totalSupply()) / 2);
    });

    it("Deployment should assign the half of the supply of tokens to the owner", async function () {
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      expect((await hardhatToken.totalSupply()) / 2).to.equal(ownerBalance);
    });
  });

  describe("Test transfer of funds", function () {
    it("Should transfer tokens between accounts", async function () {
      await hardhatToken.transfer(user1.address, 10);
      expect(await hardhatToken.balanceOf(user1.address)).to.equal(10);
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(initialSupply / 2 - 10);
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

      await expect(hardhatToken.connect(user1).transfer(owner.address, 1)).to.be.revertedWith(
        "revert Not enough token"
      );

      expect(await hardhatToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Test managing reserved supply", function () {
    it("Should fail if the caller is not the owner of the contract", async function () {
      await expect(hardhatToken.connect(user1).freeReservedSupply(10)).to.be.revertedWith(
        "revert You don't have permissions to do this"
      );
    });

    it("Should free up reserved tokens and increase open supply", async function () {
      const openSupply = await hardhatToken.openSupply();
      const reservedSupply = await hardhatToken.totalReservedSupply();

      await hardhatToken.freeReservedSupply(10);

      expect(await hardhatToken.openSupply()).to.equal(openSupply.toNumber() + 10);
      expect(await hardhatToken.totalReservedSupply()).to.equal(reservedSupply.toNumber() - 10);
    });

    it("should increase the balance of the owner", async function () {
      const ownerBalance = await hardhatToken.balanceOf(owner.address);

      await hardhatToken.freeReservedSupply(10);

      expect(await hardhatToken.balanceOf(owner.address)).to.equal(ownerBalance.toNumber() + 10);
    });
  });
});
