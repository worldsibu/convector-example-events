// tslint:disable:no-unused-expression
import { join } from 'path';
import { expect } from 'chai';
import * as uuid from 'uuid/v4';
import { MockControllerAdapter } from '@worldsibu/convector-adapter-mock';
import { ClientFactory, ConvectorControllerClient } from '@worldsibu/convector-core';
import 'mocha';

import { Prescription, PrescriptionController, PrescriptionStatus } from '../src';
import { Transaction, BankController } from 'bank-cc';

describe('Store', () => {
  let healthCtrl: ConvectorControllerClient<PrescriptionController>;
  let bankCtrl: ConvectorControllerClient<BankController>;
  
  before(async () => {
    // Mocks the blockchain execution environment
    const storeAdapter = new MockControllerAdapter();
    healthCtrl = ClientFactory(PrescriptionController, storeAdapter);

    await storeAdapter.init([
      {
        version: '*',
        controller: 'PrescriptionController',
        name: join(__dirname, '..')
      }
    ]);

    const officialAdapter = new MockControllerAdapter();
    bankCtrl = ClientFactory(BankController, officialAdapter);

    await officialAdapter.init([
      {
        version: '*',
        controller: 'BankController',
        name: join(__dirname, '../../bank-cc')
      }
    ]);

    storeAdapter.stub.mockPeerChaincode('official/ch1', officialAdapter.stub);
  });
  
  it('should create a purchase', async () => {
    const purchaseId = uuid();
    const simplePurchase = new Prescription({
      id: purchaseId,
      amount: 5000,
      created: Date.now()
    });

    await healthCtrl.register(simplePurchase);
  
    const purchase = await healthCtrl.getPrescription(purchaseId);
    expect(purchase.amount).to.eq(5000);
    expect(purchase.status).to.eq(PrescriptionStatus.PROCESSING);
  });

  it('should create a purchase and pay it', async () => {
    const purchaseId = uuid();
    const simplePurchase = new Prescription({
      id: purchaseId,
      amount: 5000,
      created: Date.now()
    });
    await healthCtrl.register(simplePurchase);
  
    const txId = uuid();
    const simpleTx = new Transaction({
      id: txId,
      ref: purchaseId,
      amount: 5000,
      created: Date.now()
    });
    await bankCtrl.pay(simpleTx);

    await healthCtrl.checkPrescription(purchaseId, txId, 'financial', 'financial');
    
    const purchase = await healthCtrl.getPrescription(purchaseId);
    expect(purchase.status).to.eq(PrescriptionStatus.APPROVED);
  });

  it('should decline a purchase if not enough founds', async () => {
    const purchaseId = uuid();
    const simplePurchase = new Prescription({
      id: purchaseId,
      amount: 5000,
      created: Date.now()
    });
    await healthCtrl.register(simplePurchase);
  
    const txId = uuid();
    const simpleTx = new Transaction({
      id: txId,
      ref: purchaseId,
      amount: 4000,
      created: Date.now()
    });
    await bankCtrl.pay(simpleTx);

    await healthCtrl.checkPrescription(purchaseId, txId, 'financial', 'financial');
    
    const purchase = await healthCtrl.getPrescription(purchaseId);
    expect(purchase.status).to.eq(PrescriptionStatus.DECLINED);
  });
});