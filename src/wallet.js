const { JsonRpcProvider, Wallet, Signature } = require('ethers');


class HDWallet {
	constructor() {
		this._isConnected = false;
		this._provider = new JsonRpcProvider(process.env.POLYGON_RPC_SERVER);
	}

	connect() {
		if (this._isConnected === false) {
			this._wallet = this.getWallet();
			this._isConnected = true;
		}
	}

	disconnect() {
		if (this._isConnected === true) {
			delete this._wallet;
			this._isConnected = false;
		}
	}

	getWallet() {
		return new Wallet(process.env.WALLET_PRIVATE_KEY, this._provider);
	}

	getWalletAddress() {
		let walletAddress = '';

		walletAddress = this.getWallet().address;

		return walletAddress;
	}

	signMessage(message) {
		return new Promise((resolve, reject) => {
			this.getWallet().signMessage(
				message
			).then((value) => {
				resolve(value);
			}).catch((reason) => {
				reject(reason);
			});
		});
	}

	signTypedData(domain, types, value) {
		return new Promise((resolve, reject) => {
			this.getWallet().signTypedData(
				domain,
				types,
				value
			).then((value) => {
				resolve(value);
			}).catch((reason) => {
				reject(reason);
			});
		});
	}

	splitSignature(signature) {
		const { v, r, s } = Signature.from(signature);

		return { v, r, s };
	}
}

module.exports = { HDWallet };