// import { promisify } from "util";

// import { rangeLogKM } from "../rangeLog";

// const sleep = promisify(setTimeout);
// //Blocks 2_661_000 - 2_761_000
// export async function jun15Batch(): Promise<void> {
//   let n = 2_661_000;
//   while (n < 2_760_000) {
//     void rangeLogKM(n, n + 1_000, "http://127.0.0.1:6969/", "ksmJun15Batch");
//     n = n + 1_000;
//   }

//   await sleep(10 * 60 * 1_000);
//   await rangeLogKM(n, n + 1_000, "http://127.0.0.1:6969/", "ksmJun15Batch");
// }
