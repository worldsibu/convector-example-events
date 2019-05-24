import * as yup from 'yup';
import {
  ConvectorModel,
  Default,
  ReadOnly,
  Required,
  Validate
} from '@worldsibu/convector-core-model';

export class Transaction extends ConvectorModel<Transaction> {
  @ReadOnly()
  @Required()
  public readonly type = 'io.worldsibu.transaction';

  @ReadOnly()
  @Required()
  @Validate(yup.number())
  public amount: number;

  @ReadOnly()
  @Required()
  @Validate(yup.string())
  public ref: string;

  @ReadOnly()
  @Required()
  @Validate(yup.string())
  public identity: string;

  @ReadOnly()
  @Required()
  @Validate(yup.number())
  public created: number;
}
