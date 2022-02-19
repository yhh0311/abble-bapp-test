import axios from 'axios';
import Caver from 'caver-js';
import KIP17ABI from '../abi/KIP17TokenABI.json';
import MarketABI from '../abi/MarketABI.json';
import { ACCESS_KEY_ID, SECRET_KEY_ID, COUNT_CONTRACT_ADDRESS, NFT_CONTRACT_ADDRESS, CHAIN_ID } from '../constants';
//import { ACCESS_KEY_ID, SECRET_KEY_ID, COUNT_CONTRACT_ADDRESS, CHAIN_ID } from '../constants';

const option = {
    headers: [
      {
        name: "Authorization",
        value: "Basic " + Buffer.from(ACCESS_KEY_ID + ":" + SECRET_KEY_ID).toString("base64")
      },
      {
        name: "x-chain-id", value: CHAIN_ID
      }
    ]
  }
  
  const caver = new Caver(new Caver.providers.HttpProvider('https://node-api.klaytnapi.com/v1/klaytn', option));
  const NFTContract = new caver.contract(KIP17ABI, NFT_CONTRACT_ADDRESS);
  
  export const fetchCardsOf = async (address) => {
    //balanceOf -> 내가 가진 전체 NFT 토큰 개수 가져오기
    //Fetch Balance
    const balance = await NFTContract.methods.balanceOf(address).call(); //nft 카드 개수
    console.log(`[NFT Balance]${balance}`);

    //tokenOfOwnerByIndex -> 내가 가진 토큰 ID 하나씩 가져옴 (배열)
    //Fetch Token IDs
    const tokenIds = [];
    for(let i=0;i<balance;i++){
      const id = await NFTContract.methods.tokenOfOwnerByIndex(address, i).call();
      tokenIds.push(id);
    }

    //tokenURI -> 앞에서 가져온 ID로 URI 가져오기
    //Fetch Token URIs
    const tokenUris = [];
    for(let i=0;i<balance;i++){
      const metadataUrl = await NFTContract.methods.tokenURI(tokenIds[i]).call(); // -> metadata kas 주소

      const response = await axios.get(metadataUrl);  //실제 메타데이터 가져오기
      const uriJSON = response.data;

      tokenUris.push(uriJSON.image);
    }

    const nfts = [];
    for(let i=0;i<balance;i++){
      nfts.push({ id:tokenIds[i], uri:tokenUris[i] })
    }
    console.log(nfts);
    return nfts;
  };
  
  
  export const getBalance = (address) => {
    return caver.rpc.klay.getBalance(address).then((res) => {
      const balance = caver.utils.convertFromPeb(caver.utils.hexToNumberString(res));
      console.log('balacne :', balance);
      return balance;
    })
  };