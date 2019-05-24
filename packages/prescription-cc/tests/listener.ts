import { homedir } from 'os';
import { resolve } from 'url';
import { ClientFactory } from '@worldsibu/convector-core';
import { FabricControllerAdapter } from '@worldsibu/convector-platform-fabric';

import { BankEvents, Transaction } from 'bank-cc';
import { PrescriptionController } from '../src';

(async () => {
  const keyStore = resolve(__dirname, '../../config');

  const financialAdapter = new FabricControllerAdapter({
    txTimeout: 300000,
    user: 'diestrin',
    channel: 'financial',
    chaincode: 'financial',
    // keyStore: `/${homedir()}/hyperledger-fabric-network/.hfc-org1`,
    // networkProfile: `/${homedir()}/hyperledger-fabric-network/network-profiles/org1.network-profile.yaml`
    keyStore,
    networkProfile: resolve(__dirname, '../../config/networkprofile-financial.yaml')
  });

  await financialAdapter.init();

  const healthAdapter = new FabricControllerAdapter({
    txTimeout: 300000,
    user: 'diestrin',
    channel: 'health',
    chaincode: 'health',
    // keyStore: `/${homedir()}/hyperledger-fabric-network/.hfc-org1`,
    // networkProfile: `/${homedir()}/hyperledger-fabric-network/network-profiles/org1.network-profile.yaml`
    keyStore,
    networkProfile: resolve(__dirname, '../../config/networkprofile-health.yaml')
  });

  await healthAdapter.init();

  const userPeer = financialAdapter.channel.getPeers()
    .find(p => p.getMspid() === financialAdapter.user.getIdentity().getMSPId());
  const hub = financialAdapter.channel.newChannelEventHub(userPeer.getPeer());
  hub.connect(true);

  const storeCtrl = ClientFactory(PrescriptionController, healthAdapter);

  console.log('Listening');
  hub.registerChaincodeEvent(
    'financial',
    BankEvents.TxSuccess,
    (event, blockNumber, txId, txStatus) => {
      console.log('Got Event', event.payload.toString('utf8'));
 
      const tx = JSON.parse(event.payload.toString('utf8')) as Transaction;

      storeCtrl.checkPrescription(tx.ref, tx.id, 'financial', 'financial');
    },
    (err) => console.error(err),
    {filtered: false} as any
  );
})();