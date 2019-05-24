// tslint:disable:no-unused-expression
import { resolve } from 'path';
import * as uuid from 'uuid/v4';

import { FabricControllerAdapter } from '@worldsibu/convector-platform-fabric';
import { ClientFactory, ConvectorControllerClient } from '@worldsibu/convector-core';

import { Transaction, BankController } from 'prescription-cc';

import { Prescription, PrescriptionController, PrescriptionStatus } from '../src';

let prescriptionCtrl: ConvectorControllerClient<PrescriptionController>;
let bankCtrl: ConvectorControllerClient<BankController>;

const configPath = '../../../config';
const user = 'diestrin';
  
(async () => {
  const keyStore = resolve(__dirname, configPath);

  const healthAdapter = new FabricControllerAdapter({
    user,
    keyStore,
    txTimeout: 300000,
    channel: 'health',
    chaincode: 'health',
    networkProfile: resolve(keyStore, 'networkprofile-health.yaml'),
    userMspPath: keyStore
  });
  prescriptionCtrl = ClientFactory(PrescriptionController, healthAdapter);

  await healthAdapter.init();

  const financialAdapter = new FabricControllerAdapter({
    user,
    keyStore,
    txTimeout: 300000,
    channel: 'financial',
    chaincode: 'financial',
    networkProfile: resolve(keyStore, 'networkprofile-financial.yaml'),
    userMspPath: keyStore
  });
  bankCtrl = ClientFactory(BankController, financialAdapter);

  await financialAdapter.init();

  console.log('Registering prescription');
  const prescriptionId = uuid();
  const simplePrescription = new Prescription({
    id: prescriptionId,
    amount: 5000,
    created: Date.now()
  });
  await prescriptionCtrl.register(simplePrescription);
  
  console.log('Paying prescription');
  const txId = uuid();
  const simpleTx = new Transaction({
    id: txId,
    ref: prescriptionId,
    amount: 5000,
    created: Date.now()
  });
  await bankCtrl.pay(simpleTx);

  console.log('Done');
})();
