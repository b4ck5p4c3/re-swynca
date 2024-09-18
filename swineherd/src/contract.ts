import { NearBindgen, call } from 'near-sdk-js';

type AuditData = {
  type: "encrypted",
  encrypted: string
}

@NearBindgen({})
class Swineherd {

  @call({})
  audit(auditData: AuditData): void {
  }
}