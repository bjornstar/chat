import Tome from '@bjornstar/tomes';
import { SockMonger } from '../sockmonger/sockmonger';

export class SleevedTome {
  connect: (sm: SockMonger) => void;
  disconnect: (sm: SockMonger) => void;
  title: string;
  tome: any;

  constructor(title: string) {
    this.title = title;

    const tome = Tome.conjure({});
    this.tome = tome;

    const handleDiff = (diff: any) => tome.merge(diff);
    const handleInit = (value: any) => tome.assign(value);
    const handleReadable = () => tome.read();

    let connected = false;

    this.connect = (sm: SockMonger) => {
      if (connected) return console.warn('already connected', title);

      sm.on(title, handleInit);
      sm.on(`${title}.diff`, handleDiff);
      tome.on('readable', handleReadable);
      console.log('connected', title)
      connected = true;
    }

    this.disconnect = (sm: SockMonger) => {
      if (!connected) return console.warn('already disconnected', title);
      sm.removeListener(title, handleInit);
      sm.removeListener(`${title}.diff`, handleDiff);
      tome.removeListener('readable', handleReadable);
      console.log('disconnected', title)
      connected = false;
    }
  }
}
