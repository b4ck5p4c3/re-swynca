import { NearBindgen, call } from 'near-sdk-js';

type AuditData = {
  data: string
}

@NearBindgen({})
class Swineherd {

  @call({})
  audit(auditData: AuditData): void {
  }
}