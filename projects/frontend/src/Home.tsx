// src/components/Home.tsx
import { Config as AlgokitConfig } from '@algorandfoundation/algokit-utils';
import AlgorandClient from '@algorandfoundation/algokit-utils/types/algorand-client';
import { useWallet } from '@txnlab/use-wallet';
import algosdk from 'algosdk';
import React, { useEffect, useState } from 'react';
import ConnectWallet from './components/ConnectWallet';
import MethodCall from './components/MethodCall';
import { DigitalMarketplaceClient } from './contracts/DigitalMarketplace';
import * as methods from './methods';
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs';

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  AlgokitConfig.configure({ populateAppCallResources: true });

  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false);
  const [appId, setAppId] = useState<number>(0);
  const [assetId, setAssetId] = useState<bigint>(0n);
  const [unitaryPrice, setUnitaryPrice] = useState<bigint>(0n);
  const [quantity, setQuantity] = useState<bigint>(0n);
  const [unitsLeft, setUnitsLeft] = useState<bigint>(0n);
  const [event_name, setEvent_name] = useState<string>('');
  const [asset_name, setAsset_name] = useState<string>('');
  const [ipfs_url, setIpfs_url] = useState<string>('');
  const [seller, setSeller] = useState<string | undefined>(undefined);
  const { activeAddress, signer } = useWallet();

  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algorand = AlgorandClient.fromConfig({ algodConfig });
  algorand.setDefaultSigner(signer);

  const dmClient = new DigitalMarketplaceClient(
    {
      resolveBy: 'id',
      id: appId,
      sender: { addr: activeAddress!, signer },
    },
    algorand.client.algod
  );

  useEffect(() => {
    dmClient
      .getGlobalState()
      .then((globalState) => {
        setUnitaryPrice(globalState.unitaryPrice?.asBigInt() || 0n);
        const id = globalState.assetId?.asBigInt() || 0n;
        setAssetId(id);
        algorand.account.getAssetInformation(algosdk.getApplicationAddress(appId), id).then((info) => {
          setUnitsLeft(info.balance);
        });
      })
      .catch(() => {
        setUnitaryPrice(0n);
        setAssetId(0n);
        setUnitsLeft(0n);
      });

    algorand.client.algod
      .getApplicationByID(appId)
      .do()
      .then((response) => {
        setSeller(response.params.creator);
      })
      .catch(() => {
        setSeller(undefined);
      });
  }, [appId, dmClient, algorand.account, algorand.client.algod]);

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal);
  };

  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">
            Welcome to <div className="font-bold">AlgoTravel ✈️</div>
          </h1>
          <p className="py-6">Where Technology Meets Adventure</p>

          <div className="grid">
            <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
              Wallet Connection
            </button>

            <div className="divider" />

            {activeAddress && appId === 0 && assetId === 0n && (
              <div>
                <div>
                  <label className="label">Ticket Name</label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={event_name}
                    onChange={(e) => setEvent_name(e.currentTarget.value || '')}
                  />
                </div>

                <div>
                  <label className="label">Asset Name</label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={asset_name}
                    onChange={(e) => setAsset_name(e.currentTarget.value || '')}
                  />
                </div>

                <div>
                  <label className="label">Quantity</label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={quantity.toString()}
                    onChange={(e) => setQuantity(BigInt(e.currentTarget.value || 0))}
                  />
                </div>

                <div>
                  <MethodCall
                    methodFunction={methods.createToken(
                      algorand,
                      activeAddress,
                      quantity,
                      assetId,
                      event_name,
                      asset_name,
                      setAssetId
                    )}
                    text="Create Token"
                  />
                </div>
              </div>
            )}

            {assetId !== 0n && (
              <div>
                <label className="label">Asset ID</label>
                <input type="text" className="input input-bordered" value={assetId.toString()} readOnly />
              </div>
            )}

            <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
