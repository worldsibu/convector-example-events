import * as yup from 'yup';
import {
  ConvectorModel,
  Default,
  ReadOnly,
  Required,
  Validate
} from '@worldsibu/convector-core-model';

export enum PrescriptionStatus {
  PROCESSING = 'PROCESSING',
  DECLINED = 'DECLINED',
  APPROVED = 'APPROVED'
}

export class Prescription extends ConvectorModel<Prescription> {
  @ReadOnly()
  @Required()
  public readonly type = 'io.worldsibu.prescription';

  @ReadOnly()
  @Required()
  @Validate(yup.string())
  public patient: string;

  @ReadOnly()
  @Required()
  @Validate(yup.number())
  public amount: number;

  @Default(PrescriptionStatus.PROCESSING)
  @Validate(yup.string().oneOf(Object.keys(PrescriptionStatus).map(k => PrescriptionStatus[k])))
  public status: string;

  @ReadOnly()
  @Required()
  @Validate(yup.number())
  public created: number;
}
