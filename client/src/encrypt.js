const { publicKeyConvert } = require("secp256k1");
const { encrypt, decrypt } = require("eccrypto");
const EthCrypto = require("eth-crypto");

const encryptMessage = async (pubKey, message) => {
  pubKey = pubKey.substring(2);
  const encrypted = await EthCrypto.encryptWithPublicKey(
    pubKey,
    JSON.stringify(message)
  );
  return EthCrypto.cipher.stringify(encrypted);
};

const decryptMessage = async (privKey, encryptedString) => {
  const encryptedObject = EthCrypto.cipher.parse(encryptedString);
  const decrypted = await EthCrypto.decryptWithPrivateKey(
    privKey,
    encryptedObject
  );
  return decrypted;
};

export default encryptMessage;
