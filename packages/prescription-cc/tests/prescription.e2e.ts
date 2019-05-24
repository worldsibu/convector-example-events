// tslint:disable:no-unused-expression
import { join, resolve } from 'path';
import { expect } from 'chai';
import * as uuid from 'uuid/v4';
import 'mocha';

import { FabricControllerAdapter } from '@worldsibu/convector-platform-fabric';
import { ClientFactory, ConvectorControllerClient } from '@worldsibu/convector-core';

import { Transaction, BankController } from 'bank-cc';

import { Prescription, PrescriptionController, PrescriptionStatus } from '../src';

describe('Store', () => {
  let prescriptionCtrl: ConvectorControllerClient<PrescriptionController>;
  let bankCtrl: ConvectorControllerClient<BankController>;

  const configPath = '../../../config';
  const user = 'diestrin';
  
  before(async () => {
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
  });
  
  it('should register a prescription', async () => {
    const prescriptionId = uuid();
    const simplePrescription = new Prescription({
      id: prescriptionId,
      amount: 5000,
      created: Date.now()
    });
    await prescriptionCtrl.register(simplePrescription);
    
    const prescription = await prescriptionCtrl.getPrescription(prescriptionId);
    expect(prescription.amount).to.eq(5000);
    expect(prescription.status).to.eq(PrescriptionStatus.PROCESSING);
  });

  it('should resgister a prescription and pay it', async () => {
    const prescriptionId = uuid();
    const simplePrescription = new Prescription({
      id: prescriptionId,
      amount: 5000,
      created: Date.now()
    });
    await prescriptionCtrl.register(simplePrescription);
  
    const txId = uuid();
    const simpleTx = new Transaction({
      id: txId,
      ref: prescriptionId,
      amount: 5000,
      created: Date.now()
    });
    await bankCtrl.pay(simpleTx);

    await prescriptionCtrl.checkPrescription(prescriptionId, txId, 'financial', 'financial');
    
    const prescription = await prescriptionCtrl.getPrescription(prescriptionId);
    expect(prescription.status).to.eq(PrescriptionStatus.APPROVED);
  });

  it('should decline a prescription if not enough founds', async () => {
    const prescriptionId = uuid();
    const simplePrescription = new Prescription({
      id: prescriptionId,
      amount: 5000,
      created: Date.now()
    });
    await prescriptionCtrl.register(simplePrescription);
  
    const txId = uuid();
    const simpleTx = new Transaction({
      id: txId,
      ref: prescriptionId,
      amount: 4000,
      created: Date.now()
    });
    await bankCtrl.pay(simpleTx);

    await prescriptionCtrl.checkPrescription(prescriptionId, txId, 'financial', 'financial');
    
    const prescription = await prescriptionCtrl.getPrescription(prescriptionId);
    expect(prescription.status).to.eq(PrescriptionStatus.DECLINED);
  });
});