// requiring the contract
var Election = artifacts.require("./Election.sol");

// exporting as module 
 module.exports = function(deployer) {
  deployer.deploy(Election);
 };

