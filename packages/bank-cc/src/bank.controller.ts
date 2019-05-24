import * as yup from 'yup';
import { ChaincodeTx } from '@worldsibu/convector-platform-fabric';
import {
  Controller,
  ConvectorController,
  Invokable,
  Param,
  FlatConvectorModel
} from '@worldsibu/convector-core';

import { Transaction } from './transaction.model';

export enum BankEvents {
  TxSuccess = 'TxSuccess'
}

@Controller('bank')
export class BankController extends ConvectorController<ChaincodeTx> {
  @Invokable()
  public async pay(
    @Param(Transaction)
    tx: Transaction
  ) {
    tx.identity = this.sender;

    // Save to ledger
    await tx.save();

    // Emit the TX event
    this.tx.stub.setEvent(BankEvents.TxSuccess, tx);
  }

  @Invokable()
  public async getTx(
    @Param(yup.string())
    txId: string
  ) {
    const tx = await Transaction.getOne(txId);

    if (!tx.id) {
      throw new Error('Transaction not found');
    }

    return tx.toJSON() as FlatConvectorModel<Transaction>;
  }
}