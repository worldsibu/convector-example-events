// tslint:disable:no-unused-expression
import { join } from 'path';
import { expect } from 'chai';
import * as uuid from 'uuid/v4';
import { MockControllerAdapter } from '@worldsibu/convector-adapter-mock';
import { ClientFactory, ConvectorControllerClient } from '@worldsibu/convector-core';
import 'mocha';

import { Transaction, BankController } from '../src';

describe('Bank', () => {
  let adapter: MockControllerAdapter;
  let bankCtrl: ConvectorControllerClient<BankController>;
  
  before(async () => {
    // Mocks the blockchain execution environment
    adapter = new MockControllerAdapter();
    bankCtrl = ClientFactory(BankController, adapter);

    await adapter.init([
      {
        version: '*',
        controller: 'BankController',
        name: join(__dirname, '..')
      }
    ]);
  });
  
  it('should create a transaction', async () => {
    const id = uuid();

    const simpleTx = new Transaction({
      id,
      ref: 'test',
      amount: 5000,
      created: Date.now()
    });

    await bankCtrl.pay(simpleTx);

    const tx = await bankCtrl.$query().getTx(id);
  
    expect(tx.amount).to.eq(5000);
  });
});