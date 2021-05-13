import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, BigNumber } from "ethers";

describe("RedsCoins Token Sale", function () {
  const initialSupply = 100;
  const price = 1000000000000000;
  const maximumGiftAmount = 5;
  let initialSaleSupply;
  let RedsCoin;
  let RedsCoinSale;
  let owner;
  let hardhatToken;
  let hardhatSale;
  let user1;
  let user2;
  let users;

  beforeEach(async function () {
    [owner, user1, user2, ...users] = await ethers.getSigners();
    RedsCoin = await ethers.getContractFactory("RedsCoin");
    RedsCoinSale = await ethers.getContractFactory("RedsCoinTokenSale");

    hardhatToken = await RedsCoin.deploy(initialSupply);
    hardhatSale = await RedsCoinSale.deploy(hardhatToken.address, price, 5);

    initialSaleSupply = await hardhatToken.openSupply();

    hardhatToken.transfer(hardhatSale.address, initialSaleSupply, { from: owner.address });
  });

  describe("Test initial values of sale", function () {
    it("Should have the right token price", async function () {
      expect(await hardhatSale.tokenPrice()).to.equal(price);
    });

    it("Should have the right maximum gift amount", async function () {
      expect(await hardhatSale.maximumGiftAmount()).to.equal(maximumGiftAmount);
    });

    it("Should have for sale the total open supply", async function () {
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(0);
      expect(await hardhatToken.balanceOf(hardhatSale.address)).to.equal(initialSaleSupply);
    });
  });

  describe("Test token buying", function () {
    it("Should fail if not passed enough Ether for the amount of requested tokens", async function () {
      await expect(hardhatSale.buyTokens(10, { value: 1 * price })).to.be.revertedWith(
        "revert You need to pay more for that"
      );
    });

    it("Should not allow buying more tokens than the ones on sale", async function () {
      const n = BigNumber.from(price);

      await expect(hardhatSale.buyTokens(1000, { value: n.mul(1000) })).to.be.revertedWith(
        "revert Not enough tokens for sale"
      );
    });

    it("Should transfer the tokens on succesfull purchase", async function () {
      const n = BigNumber.from(price);
      const initialSupply = await hardhatToken.balanceOf(hardhatSale.address);

      await hardhatSale.buyTokens(10, { value: n.mul(10) });

      expect(await hardhatToken.balanceOf(owner.address)).to.equal(10);
      expect(await hardhatToken.balanceOf(hardhatSale.address)).to.equal(initialSupply - 10);
    });

    it("Should update the tokens sale amount", async function () {
      const n = BigNumber.from(price);
      const initialSupply = await hardhatToken.balanceOf(hardhatSale.address);

      await hardhatSale.buyTokens(10, { value: n.mul(10) });

      expect(await hardhatSale.tokensSold()).to.equal(10);
    });
  });

  describe("Test ending the sale", function () {
    it("Should allow just the sale admin to end it", async function () {
      await expect(hardhatSale.connect(user1).endSale()).to.be.revertedWith(
        "revert You don't have permissions to do that"
      );
    });

    it("Should move back all non sold tokens", async function () {
      const currentSupply = await hardhatToken.balanceOf(hardhatSale.address);

      await hardhatSale.endSale();

      expect(await hardhatToken.balanceOf(hardhatSale.address)).to.equal(0);
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(currentSupply);
    });
  });

  describe("Test gifting of tokens", function () {
    it("Should not allow to gift more than the maximum amount per address", async function () {
      await expect(hardhatSale.claimGiftTokens(maximumGiftAmount + 10)).to.be.revertedWith(
        "revert You can't claim that many gift tokens"
      );
    });

    it("Should gift the right amount of tokens", async function () {
      const giftAmount = maximumGiftAmount - 3;
      await hardhatSale.claimGiftTokens(giftAmount);

      expect(await hardhatToken.balanceOf(owner.address)).to.equal(giftAmount);
      expect(await hardhatToken.balanceOf(hardhatSale.address)).to.equal(
        initialSaleSupply - giftAmount
      );
    });

    it("should allow to claim gift multiple times", async function () {
      await hardhatSale.claimGiftTokens(1);
      await hardhatSale.claimGiftTokens(1);

      expect(await hardhatToken.balanceOf(owner.address)).to.equal(2);
      expect(await hardhatToken.balanceOf(hardhatSale.address)).to.equal(initialSaleSupply - 2);
    });
  });
});
