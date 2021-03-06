import { getBalance, readCount, setCount, fetchCardsOf } from './api/UseCaver';
import * as KlipAPI from "./api/UseKlip";
import * as KasAPI from "./api/UseKAS";
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';
import './market.css';
import { Alert, Container, Card, Nav, Form, Button, Modal, Row, Col } from 'react-bootstrap';
import { MARKET_CONTRACT_ADDRESS } from './constants';
//import { privateKey } from 'caver-js/packages/caver-wallet/src/keyring/keyringFactory';

function onPressButton(){
  console.log('pressed');
}

const onPressButton2 = (_balance, _setBalance) => {
  //console.log('pressed 2');
  _setBalance(_balance);
}

const DEFAULT_QR_CODE = "DEFAULT";
const DEFAULT_ADDRESS = "0x000000000000000";

function App() {
  // =========== State Data (변수) ===========

  // ------ Global Data ------ 
  // address
  // NFT 
  const [nfts, setNfts] = useState([]); //{tokenId:'101', tokenUri:'~~~.png'}
  const [myBalance, setMyBalance] = useState('0');
  const [myAddress, setMyAddress] = useState(DEFAULT_ADDRESS); //'0xA9A9B4Cac7C9A132A6909513a32993a755F96F44');

  // ------ UI ------ 
  const [qrvalue, setQrvalue] = useState(DEFAULT_QR_CODE);
  const [tab, setTab] = useState('MARKET'); //MARKET, MINT, WALLET = tab (어떤 탭 클릭했는지)
  const [mintImageUrl, setMintImageUrl] = useState("");
  const [mintTokenID, setMintTokenID] = useState("");

  // ------ Modal ------ 
  const [showModal, setShowModal] = useState(false);
  const [modalProps, setModalProps] = useState({
    title: "MODAL",
    onConfirm: () => {},
  });
  const rows = nfts.slice(nfts.length / 2);

  // =========== 함수 ===========
  // fetchMarketNFTs
  const fetchMarketNFTs = async () => {
    const _nfts = await fetchCardsOf(MARKET_CONTRACT_ADDRESS);
    setNfts(_nfts);
  };

  // fetchMyNFT
  const fetchMyNFTs = async () => {
    if (myAddress === DEFAULT_ADDRESS) {
      alert("NO ADDRESS");
      return;
    }
    const _nfts = await fetchCardsOf(myAddress);
    setNfts(_nfts);
  };

  // onClickMint
  const onClickMint = async (uri, tokenID) => {
    if (myAddress === DEFAULT_ADDRESS) {
      alert("NO ADDRESS");
      return;
    }

    //metadata 업로드 -> uri 받아서 업로드
    const metadataUrl = await KasAPI.uploadMetaData(uri);
    if(!metadataUrl){
      alert('metadata 업로드에 실패하였습니다.');
      return;
    }

    KlipAPI.mintCardWithURI(
      myAddress,
      tokenID,
      metadataUrl,
      setQrvalue,
      (result) => {
        alert(JSON.stringify(result));
      }
    );
  };

  const onClickCard = (id) => {
    if (tab === "WALLET") {
      setModalProps({
        title: "NFT를 마켓에 올리시겠어요?",
        onConfirm: () => {
          onClickMyCard(id);
        },
      });
      setShowModal(true);
    }
    if (tab === "MARKET") {
      setModalProps({
        title: "NFT를 구매하시겠어요?",
        onConfirm: () => {
          onClickMarketCard(id);
        },
      });
      setShowModal(true);
    }
  };
  
  // onClickMyCard
  const onClickMyCard = (tokenId) => {
    KlipAPI.listingCard(myAddress, tokenId, setQrvalue, (result) => {
      alert(JSON.stringify(result));
    });
  };

  // onClickMarketCard
  const onClickMarketCard = (tokenId) => {
    KlipAPI.buyCard(tokenId, setQrvalue, (result) => {
      alert(JSON.stringify(result));
    });
  };

  // getUserData
  const getUserData = () => {
    setModalProps({
      title: "Klip 지갑을 연동하시겠습니까?",
      onConfirm: () => {
        KlipAPI.getAddress(setQrvalue, async (address) => {
          setMyAddress(address);
          const _balance = await getBalance(address);
          setMyBalance(_balance);
        });
      },
    });
    setShowModal(true);
  };

  // 시작 시 실행
  useEffect(() => {
    getUserData();
    fetchMarketNFTs();
  }, []);

  return (
    <div className="App">
      <div style={ {backgroundColor: "black", padding: 10}}>
        
        {/* 주소 잔고 */}
        <div style={{fontSize: 25, fontWeight: "bold", paddingLeft:5, marginTop:10}}> 
          내 지갑
        </div>
        {myAddress}
        <br />
        <Alert
          onClick={getUserData}
          variant={"balance"}
          style={{ backgroundColor: "#f40075", fontSize: 25 }}
        >
          {myAddress !== DEFAULT_ADDRESS
            ? `${myBalance} KLAY`
            : "지갑 연동하기"}
        </Alert>

        {/* QR코드 뷰어 */}
        {qrvalue !== "DEFAULT" ? (
          <Container style={{ backgroundColor: "white", width: 300, height: 300, padding: 20 }} >
            <QRCode value={qrvalue} size={256} style={{ margin: "auto" }} />
            <br />
          </Container>
        ) : null}
        <br />
        <br />

        {/* 갤러리(마켓, 내지갑) */}
        {tab === "MARKET" || tab === "WALLET" ? (
          <div className="container" style={{ padding: 0, width: "100%" }}>
            {rows.map((o, rowIndex) => (
              <Row key={`rowkey${rowIndex}`}>
                <Col style={{ marginRight: 0, paddingRight: 0 }}>
                  <Card
                    onClick={() => {
                      onClickCard(nfts[rowIndex * 2].id);
                    }}
                  >
                    <Card.Img src={nfts[rowIndex * 2].uri} />
                  </Card>
                  [{nfts[rowIndex * 2].id}]NFT
                </Col>
                <Col style={{ marginRight: 0, paddingRight: 0 }}>
                  {nfts.length > rowIndex * 2 + 1 ? (
                    <Card
                      onClick={() => {
                        onClickCard(nfts[rowIndex * 2 + 1].id);
                      }}
                    >
                      <Card.Img src={nfts[rowIndex * 2 + 1].uri} />
                    </Card>
                  ) : null}
                  {nfts.length > rowIndex * 2 + 1 ? (
                    <>[{nfts[rowIndex * 2 + 1].id}]NFT</>
                  ) : null}
                </Col>
              </Row>
            ))}
          </div>
        ) : null}
        <br />
        <br />

        {/* 발행 페이지 */}
        {tab === "MINT" ? (
          <div className="container" style={{ padding: 0, width: "100%" }}>
            <Card
              className="text-center"
              style={{ color: "black", height: "50%", borderColor: "#C5B358" }}
            >
              <Card.Body style={{ opacity: 0.9, backgroundColor: "black" }}>
                {mintImageUrl !== "" ? (
                  <Card.Img src={mintImageUrl} height={"50%"} />
                ) : null}
                <Form>
                  <Form.Group>
                    <Form.Control
                      value={mintImageUrl}
                      onChange={(e) => {
                        console.log(e.target.value);
                        setMintImageUrl(e.target.value);
                      }}
                      type="text"
                      placeholder="이미지 주소를 입력해주세요"
                    />
                    <br />
                    <Form.Control
                      value={mintTokenID}
                      onChange={(e) => {
                        console.log(e.target.value);
                        setMintTokenID(e.target.value);
                      }}
                      type="text"
                      placeholder="토큰 ID를 입력해주세요"
                    />
                  </Form.Group>
                  <br />
                  <Button
                    onClick={() => {
                      onClickMint(mintImageUrl, mintTokenID);
                    }}
                    variant="primary"
                    style={{
                      backgroundColor: "#810034",
                      borderColor: "#810034",
                    }}
                  >
                    발행하기
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </div>
        ) : null}
      </div>
      <br />
      <br />
      <br />
      <br />
      <br />


      {/* 모달 */}
      <Modal centered size="sm" show={showModal} onHide={() => { setShowModal(false); }} >
        <Modal.Header style={{ border: 0, backgroundColor: "black", opacity: 0.8 }} >
          <Modal.Title>{modalProps.title}</Modal.Title>
        </Modal.Header>
        <Modal.Footer  style={{ border: 0, backgroundColor: "black", opacity: 0.8 }} >
          <Button variant="secondary" onClick={() => { setShowModal(false); }}> 닫기 </Button>
          <Button variant="primary" 
            onClick={() => {
              modalProps.onConfirm();
              setShowModal(false);
            }}
            style={{ backgroundColor: "#810034", borderColor: "#810034" }}
          >
            진행
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 탭 */}
      <nav
        style={{ backgroundColor: "#1b1717", height: 45 }}
        className="navbar fixed-bottom navbar-light"
        role="navigation"
      >
        <Nav className="w-100">
          <div className="d-flex flex-row justify-content-around w-100">
            <div
              onClick={() => {
                setTab('MARKET');
                fetchMarketNFTs();
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div>
                MARKET
              </div>
            </div>
            <div
              onClick={() => {
                setTab('MINT');
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div>
                MINT
              </div>
            </div>
            <div
              onClick={() => {
                setTab('WALLET');
                fetchMyNFTs();
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div>
                WALLET
              </div>
            </div>
          </div>
        </Nav>
      </nav>

    </div>
  );
}

export default App;
