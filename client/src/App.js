import React, { Component } from "react";
import IPFSInboxContract from "./IPFSInbox.json";
import getWeb3 from "./getWeb3";
import truffleContract from "truffle-contract";
import ipfs from "./ipfs";
import encryptMessage from "./encrypt";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      storageValue: 0,
      web3: null,
      accounts: null,
      contract: null,
      ipfsHash: null,
      formIPFS: "",
      formAddress: "",
      formPublicKey: "",
      encryptedIPFS: "",
      receivedIPFS: ""
    };

    this.handleChangeAddress = this.handleChangeAddress.bind(this);
    this.handleChangePublicKey = this.handleChangePublicKey.bind(this);
    this.handleChangeIPFS = this.handleChangeIPFS.bind(this);
    this.handleSend = this.handleSend.bind(this);
    this.handleReceiveIPFS = this.handleReceiveIPFS.bind(this);
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const Contract = truffleContract(IPFSInboxContract);
      Contract.setProvider(web3.currentProvider);
      const instance = await Contract.deployed();

      instance.inboxResponse().on("data", result => {
        this.setState({ receivedIPFS: result.args[0] });
      });

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  // BELOW ADDED
  handleChangePublicKey(event) {
    this.setState({ formPublicKey: event.target.value });
  }

  handleChangeAddress(event) {
    this.setState({ formAddress: event.target.value });
  }

  handleChangeIPFS(event) {
    this.setState({ formIPFS: event.target.value });
  }

  handleSend(event) {
    event.preventDefault();
    const contract = this.state.contract;
    const account = this.state.accounts[0];
    encryptMessage(this.state.formPublicKey, this.state.formIPFS).then(
      result => {
        this.setState({ encryptedIPFS: result });
        document.getElementById("new-notification-form").reset();
        this.setState({ showNotification: true });
        console.log(this.state.encryptedIPFS);
        contract
          .sendIPFS(this.state.formAddress, this.state.encryptedIPFS, {
            from: account
          })
          .then(result => {
            console.log("hello");
            this.setState({ formAddress: "" });
            this.setState({ formIPFS: "" });
          });
      }
    );
  }

  handleReceiveIPFS(event) {
    event.preventDefault();
    const contract = this.state.contract;
    const account = this.state.accounts[0];
    contract.checkInbox({ from: account });
  }

  convertToBuffer = async reader => {
    //file is converted to a buffer for upload to IPFS
    const buffer = await Buffer.from(reader.result);
    //set this buffer -using es6 syntax
    this.setState({ buffer });
  };

  captureFile = event => {
    event.stopPropagation();
    event.preventDefault();
    const file = event.target.files[0];
    let reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => this.convertToBuffer(reader);
  };

  onIPFSSubmit = async event => {
    event.preventDefault();
    await ipfs.add(this.state.buffer, (err, ipfsHash) => {
      console.log(err, ipfsHash);
      //setState by setting ipfsHash to ipfsHash[0].hash
      this.setState({ ipfsHash: ipfsHash[0].hash });
    });
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h2> 1. Add a file to IPFS here </h2>
        <form
          id="ipfs-hash-form"
          className="scep-form"
          onSubmit={this.onIPFSSubmit}
        >
          <input type="file" onChange={this.captureFile} />
          <button type="submit">Send it</button>
        </form>
        <p> The IPFS hash is: {this.state.ipfsHash}</p>
        <h2> 2. Send notifications here </h2>
        <form
          id="new-notification-form"
          className="scep-form"
          onSubmit={this.handleSend}
        >
          <label>
            Receiver Address:
            <input
              type="text"
              value={this.state.value}
              onChange={this.handleChangeAddress}
            />
          </label>
          <label>
            Public Key:
            <input
              type="text"
              value={this.state.value}
              onChange={this.handleChangePublicKey}
            />
          </label>
          <label>
            IPFS Address:
            <input
              type="text"
              value={this.state.value}
              onChange={this.handleChangeIPFS}
            />
          </label>
          <input type="submit" value="Submit" />
        </form>
        <h2> 3. Receive Notifications </h2>
        <button onClick={this.handleReceiveIPFS}>Receive IPFS</button>
        <p>{this.state.receivedIPFS}</p>
      </div>
    );
  }
}

export default App;
