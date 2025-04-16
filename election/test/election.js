let Election = artifacts.require("./Election.sol");

 contract("Election", async function(accounts){
    console.log('Your Available Ganache Accounts: ' + accounts)
    
    it("initialize with two candidates", async function(){
        // fetching the deployed contract instance 
        const deployedContract = await Election.deployed()
        
        // calling the "candidatesCount()" function of the contract
        const numberOfCanddates = await deployedContract.candidatesCount()

        // checking if candidate count is 2. At the beginning the smart contract has two candidates
        assert.equal( numberOfCanddates, 2 )
   });

   it("it initialize the candidates with the correct values", async function(){
        // fetching the deployed contract instance 
        const deployedContract = await Election.deployed()

        // calling the public mapping data object "candidates" from smart contract | candidate 1 is being called
        const candidateOneAttribute = await deployedContract.candidates(1);

        // validating the initial value of candidate One.
        assert.equal( candidateOneAttribute[0], 1, "contains correct id" );
        assert.equal( candidateOneAttribute[1], "Candidate 1", "contains correct name" );
        assert.equal( candidateOneAttribute[2], 0, "contains correct votes count" );

        // calling the public mapping data object "candidates" from smart contract | candidate 2 is being called
        const candidateTwoAttribute = await deployedContract.candidates(2);
        
        // validating the initial value of candidate two.
        assert.equal( candidateTwoAttribute[0], 2, "contains correct id" );
        assert.equal( candidateTwoAttribute[1], "Candidate 2", "contains correct name" );
        assert.equal( candidateTwoAttribute[2], 0, "contains correct votes count" );
   });
});

