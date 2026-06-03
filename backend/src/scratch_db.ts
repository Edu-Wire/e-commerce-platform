import { getQueuedAuctions } from './controllers/auctionController';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const req = {} as any;
  const res = {
    json: (data: any) => console.log("JSON response:", data),
    status: (code: number) => {
      console.log("Status code:", code);
      return res;
    }
  } as any;

  try {
    await getQueuedAuctions(req, res);
  } catch (err) {
    console.error("Error executing controller:", err);
  }
}

main().then(() => process.exit(0)).catch(console.error);
