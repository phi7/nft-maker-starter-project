// NftUploader.jsx
import { ethers } from "ethers";
import { Button } from "@mui/material";
import React from "react";
import { useEffect, useState } from 'react'
import ImageLogo from "./image.svg";
import "./NftUploader.css";
import Web3Mint from "../../utils/Web3Mint.json";
import { Web3Storage } from 'web3.storage'

const NftUploader = () => {
  /*
   * ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
   */
  const [currentAccount, setCurrentAccount] = useState("");
  const [nftCount,setNFTCount] = useState(0);
  /*この段階でcurrentAccountの中身は空*/
  console.log("currentAccount: ", currentAccount);

  const checkIfWalletIsConnected = async () => {
    /*
     * ユーザーがMetaMaskを持っているか確認します。
     */
    //window.ethereum は MetaMask が提供する API
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // accountsにWEBサイトを訪れたユーザーのウォレットアカウントを格納する（複数持っている場合も加味、よって account's' と変数を定義している）
    const accounts = await ethereum.request({ method: "eth_accounts" });

    // もしアカウントが一つでも存在したら、以下を実行。
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }

  };

  const connectWallet = async () =>{
    try {
      // ユーザーが認証可能なウォレットアドレスを持っているか確認
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      /*
       * ウォレットアドレスに対してアクセスをリクエストしています。
       */
      // 持っている場合は、ユーザーに対してウォレットへのアクセス許可を求める。許可されれば、ユーザーの最初のウォレットアドレスを currentAccount に格納する。
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      /*
       * ウォレットアドレスを currentAccount に紐付けます。
       */
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async (ipfs) => {
    const CONTRACT_ADDRESS =
      "0x2486c865883642c87C1422dbaEf1AA530a841333";
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Web3Mint.abi,
          signer
        );
        console.log("Going to pop wallet now to pay gas...");
        //mintIpfsNFT関数を呼び出し，NFTの発行が承認（=マイニングされるまで待つ）されるのを待つ
        let nftTxn = await connectedContract.mintIpfsNFT("ranker",ipfs);
        console.log("Mining...please wait.");
        //承認が終わったらトランザクションの結果を取得
        await nftTxn.wait();
        // checkNFTCount(nftTxn);
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const imageToNFT = async (e) => {
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGNhM2I2RTUzYTI4YTA4NmViMTBDY0UyOEM4Mjc3Mzk4MTY4MWI3MGMiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTg2NDU1MDg3MjIsIm5hbWUiOiJyYW5rZXIifQ.qXR3IMorGYrXB74eP1F466y7Jcdno5HD0hXTIKIpmmQ"
    const client = new Web3Storage({ token: API_KEY })
    const image = e.target
    console.log(image)
    //画像をipfsで保存している
    const rootCid = await client.put(image.files, {
        name: 'experiment',
        maxRetries: 3
    })
    //今度は保存したデータを取りにいっている
    const res = await client.get(rootCid) // Web3Response
    const files = await res.files() // Web3File[]
    for (const file of files) {
      console.log("file.cid:",file.cid)
      askContractToMintNft(file.cid)
    }
}

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  /*
  * ページがロードされたときに useEffect()内の関数が呼び出されます。
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(()=> {
    const checkNFTCount = async() => {

      const CONTRACT_ADDRESS =
      "0x2486c865883642c87C1422dbaEf1AA530a841333";
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Web3Mint.abi,
          provider
        );
        let nftTxn = await connectedContract.readTokenIds;
        console.log("Mining...please wait.2");
        console.log(nftTxn.newItemId2());
        setNFTCount(nftTxn.newItemId2());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
    }
    checkNFTCount();
  },[nftCount])

  return (
    <div className="outerBox">
      {currentAccount === "" ? (
        renderNotConnectedContainer()
      ) : (
        <>
          <p>If you choose image, you can mint your NFT</p>
          <div>発行数{nftCount}/30</div>
        </>
      )}
      <div className="title">
        <h2>NFTアップローダー</h2>
      </div>
      <div className="nftUplodeBox">
        <div className="imageLogoAndText">
          <img src={ImageLogo} alt="imagelogo" />
          <p>ここにドラッグ＆ドロップしてね</p>
        </div>
        <input className="nftUploadInput" multiple name="imageURL" type="file" accept=".jpg , .jpeg , .png" onChange={imageToNFT} />
      </div>
      <p>または</p>
      <Button variant="contained">
        ファイルを選択
        <input className="nftUploadInput" type="file" accept=".jpg , .jpeg , .png" onChange={imageToNFT}/>
      </Button>
    </div>
  );
};

export default NftUploader;