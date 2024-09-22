import {SerialPort} from "serialport";
import {SerialPortOpenOptions} from "serialport/dist/serialport";
import {AutoDetectTypes} from "@serialport/bindings-cpp";

export class SerialPortWrapper {
    private serialPort: SerialPort;
    private openPromiseResolve: () => void;
    private openPromiseReject: (error: Error) => void;
    private readonly openPromise: Promise<void>;

    constructor(options: SerialPortOpenOptions<AutoDetectTypes>) {
        this.openPromise = new Promise<void>((resolve, reject) => {
            this.openPromiseResolve = resolve;
            this.openPromiseReject = reject;
        })
        this.serialPort = new SerialPort(options, (error) => {
            if (error) {
                this.openPromiseReject(error);
                return;
            }
            this.openPromiseResolve();
        });
    }

    open(): Promise<void> {
        return this.openPromise;
    }

    close(): Promise<void> {
        let closePromiseResolve: () => void;
        let closePromiseReject: (error: Error) => void;
        const closePromise = new Promise<void>((resolve, reject) => {
            closePromiseResolve = resolve;
            closePromiseReject = reject;
        })
        this.serialPort.close((error) => {
            if (error) {
                closePromiseReject(error);
                return;
            }
            closePromiseResolve();
        });

        return closePromise;
    }

    async write(data: Buffer): Promise<void> {
        await this.serialPort.port.write(data);
    }

    async read(length: number): Promise<Buffer> {
        const buffer = Buffer.alloc(length);
        let read = 0;
        while (read < length) {
            const result = await this.serialPort.port.read(buffer, read, length - read);
            read += result.bytesRead;
        }
        return buffer;
    }
}