import { AutoDetectTypes } from '@serialport/bindings-cpp'
import { SerialPort } from 'serialport'
import { SerialPortOpenOptions } from 'serialport/dist/serialport'

export class SerialPortWrapper {
  private readonly openPromise: Promise<void>
  private openPromiseReject: (error: Error) => void
  private openPromiseResolve: () => void
  private serialPort: SerialPort

  // @ts-expect-error: Bad typings in SerialPort platform-dependent code
  constructor (options: SerialPortOpenOptions<AutoDetectTypes>) {
    this.openPromise = new Promise<void>((resolve, reject) => {
      this.openPromiseResolve = resolve
      this.openPromiseReject = reject
    })
    this.serialPort = new SerialPort(options, (error) => {
      if (error) {
        this.openPromiseReject(error)
        return
      }
      this.openPromiseResolve()
    })
  }

  close (): Promise<void> {
    let closePromiseResolve: () => void
    let closePromiseReject: (error: Error) => void
    const closePromise = new Promise<void>((resolve, reject) => {
      closePromiseResolve = resolve
      closePromiseReject = reject
    })
    this.serialPort.close((error) => {
      if (error) {
        closePromiseReject(error)
        return
      }
      closePromiseResolve()
    })

    return closePromise
  }

  open (): Promise<void> {
    return this.openPromise
  }

  async read (length: number): Promise<Buffer> {
    const buffer = Buffer.alloc(length)
    let read = 0
    while (read < length) {
      const result = await this.serialPort.port.read(
        buffer,
        read,
        length - read
      )
      read += result.bytesRead
    }
    return buffer
  }

  async write (data: Buffer): Promise<void> {
    await this.serialPort.port.write(data)
  }
}
