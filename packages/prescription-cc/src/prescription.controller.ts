import * as yup from 'yup';
import { ChaincodeTx } from '@worldsibu/convector-platform-fabric';
import { InChaincodeAdapter } from '@worldsibu/convector-adapter-fabric-in-chaincode';
import {
  Controller,
  ConvectorController,
  Invokable,
  Param,
  ClientFactory,
  FlatConvectorModel
} from '@worldsibu/convector-core';

import { BankController } from 'bank-cc';

import { Prescription, PrescriptionStatus } from './prescription.model';

const adapter = new InChaincodeAdapter();
const bankController = ClientFactory(BankController, adapter);

@Controller('prescription')
export class PrescriptionController extends ConvectorController<ChaincodeTx> {
  @Invokable()
  public async register(
    @Param(Prescription)
    purchase: Prescription
  ) {
    purchase.patient = this.sender;
    await purchase.save();
  }

  @Invokable()
  public async getPrescription(
    @Param(yup.string())
    prescriptionId: string
  ) {
    const purchase = await Prescription.getOne(prescriptionId);

    if (!purchase.id) {
      throw new Error('No purchase found');
    }

    return purchase.toJSON() as FlatConvectorModel<Prescription>;
  }

  @Invokable()
  public async checkPrescription(
    @Param(yup.string())
    prescriptionId: string,
    @Param(yup.string())
    txId: string,
    @Param(yup.string())
    channel: string,
    @Param(yup.string())
    chaincode: string
  ) {
    const prescription = await Prescription.getOne(prescriptionId);

    if (!prescription.id) {
      throw new Error('No prescription found');
    }

    const tx = await bankController
      .$config({ tx: this.tx, channel, chaincode })
      .getTx(txId);

    if (prescriptionId !== tx.ref) {
      throw new Error('Tx is not for this prescription');
    }

    if (prescription.amount !== tx.amount) {
      prescription.status = PrescriptionStatus.DECLINED;
    } else {
      prescription.status = PrescriptionStatus.APPROVED;
    }

    prescription.save();
  }
}