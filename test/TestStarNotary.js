const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;
var account0;
var account1;
var account2;
var account3;
var account4;
var account5;
var starCount;
var star1Id;
var star2Id;

contract('StarNotary', (accs) => {
    accounts = accs;
    starCount = 100;
    owner = accounts[0];
    account0 = accounts[0];
    account1 = accounts[1];
    account2 = accounts[2];
    account3 = accounts[3];
    account4 = accounts[4];
    account5 = accounts[5];
});

const newStarId = () => {
    return starCount++;    
}

beforeEach(function(){
    star1Id = newStarId();
    star2Id = newStarId();
});
    
it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    let instance = await StarNotary.deployed();
    assert.equal(await instance.symbol.call(), "APCS");
    assert.equal(await instance.name.call(), "AP CryptoStar");
});

it('lets 2 users exchange stars', async() => {
    const instance = await StarNotary.deployed();
    await instance.createStar('awesome star1', star1Id, {from: account3});
    await instance.createStar('awesome star2', star2Id, {from: account4});
    
    await instance.exchangeStars(star1Id, star2Id, {from: account3});
    
    assert.equal(await instance.ownerOf.call(star1Id), account4);
    assert.equal(await instance.ownerOf.call(star2Id), account3);
});

it('lets a user transfer a star', async() => {
    const instance = await StarNotary.deployed();            
    await instance.createStar('awesome star1', star1Id, {from: account1});    
    await instance.transferStar(account2, star1Id, {from: account1});
    assert.equal(await instance.ownerOf.call(star1Id), account2);
});

it('lookUptokenIdToStarInfo test', async() => {
    const instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', star1Id, {from: account1});
    assert.equal(await instance.lookUptokenIdToStarInfo(star1Id, {from: account1}), 'Awesome Star!');            
});

describe('token metadata' , () => {
    it('symbol is "APCS"', async() => {
        let instance = await StarNotary.deployed();
        assert.equal(await instance.symbol.call(), "APCS");
    });
    
    it('name is "AP CryptoStar"', async() => {    
        let instance = await StarNotary.deployed();
        assert.equal(await instance.name.call(), "AP CryptoStar");
    });
});

describe('star name' , () => {
    it('retrieve the star name correctly', async () => {        
        const instance = await StarNotary.deployed();
        await instance.createStar('Awesome Star!', star1Id, {from: account1});
        assert.equal(await instance.lookUptokenIdToStarInfo(star1Id, {from: account1}), 'Awesome Star!');            
    })

    it('fails if token id does not exists', async () => {
        try {                
            const instance = await StarNotary.deployed();            
            assert.equal(await instance.lookUptokenIdToStarInfo(99000, {from: account1}), 'Awesome Star!');
            return Promise.reject('Expected an error');
        } catch (err) {
        }        
    })
});

describe('star exchange', () => {

    describe('should fail', () => {
        it('star exists but transaction is not initiated by one of the owners', async () => {            
            const instance = await StarNotary.deployed();                    
            await instance.createStar('awesome star1', star1Id, {from: account3});
            await instance.createStar('awesome star2', star2Id, {from: account4});
            
            try {
                await instance.exchangeStars(star1Id, star2Id, {from: account5});
                return Promise.reject('Expected an error');
            } catch (error) {
            }            
        });
    
        it('first star does not exists', async () => {
            const instance = await StarNotary.deployed();                
            await instance.createStar('awesome star2', star2Id, {from: account4});
            
            try {
                await instance.exchangeStars(20000, star2Id, {from: account4});
                return Promise.reject('Expected an error');
            } catch (error) {
            }
        });
    
        it('second star does not exists', async () => {
            const instance = await StarNotary.deployed();                                
                await instance.createStar('awesome star1', star1Id, {from: account4});
                
                try {
                    await instance.exchangeStars(star1Id, 20000, {from: account4});
                    return Promise.reject('Expected an error');
                } catch (error) {
                }
        });
    })
    
    describe('succeed', () => {
        it('star exists and transaction is initiated by the first star owner', async () => {
            const instance = await StarNotary.deployed();
            await instance.createStar('awesome star1', star1Id, {from: account3});
            await instance.createStar('awesome star2', star2Id, {from: account4});
            
            await instance.exchangeStars(star1Id, star2Id, {from: account3});
            
            assert.equal(await instance.ownerOf.call(star1Id), account4);
            assert.equal(await instance.ownerOf.call(star2Id), account3);
        })

        it('star exists and transaction is initiated by the second star owner', async () => {
            const instance = await StarNotary.deployed();
            await instance.createStar('awesome star1', star1Id, {from: account3});
            await instance.createStar('awesome star2', star2Id, {from: account4});
            
            try {
                await instance.exchangeStars(star1Id, star2Id, {from: account4});
            } catch (err) {
                console.log(err);
            }
            
            assert.equal(await instance.ownerOf.call(star1Id), account4);
            assert.equal(await instance.ownerOf.call(star2Id), account3);
        })
    });
});

describe('star transfer', () => {
    it('a star can be transfered by its owner', async () => {
        const instance = await StarNotary.deployed();
            
        await instance.createStar('awesome star1', star1Id, {from: account1});
        
        await instance.transferStar(account2, star1Id, {from: account1});
        
        assert.equal(await instance.ownerOf.call(star1Id), account2);
    });

    it('a star cannot be transfered from a non owner', async () => {
        const instance = await StarNotary.deployed();
            
        await instance.createStar('awesome star1', star1Id, {from: account1});
        
        try {
            await instance.transferStar(account2, star1Id, {from: account3});
            return Promise.reject('Expected an error');
        } catch (err) {
        }
    });
});