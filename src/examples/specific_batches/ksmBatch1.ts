// import { promisify } from "util";

// import { rangeLog } from "../rangeLog";

// const sleep = promisify(setTimeout);
// //Blocks 2_201_992 - 2_671_538
// export async function b1(): Promise<void> {
//   let n = 2_201_992;
//   // 2_201_992 -> 2_301_992
//   for (let i = 0; i < 5; i += 1) {
//     void rangeLog(n, n + 20_000, "http://127.0.0.1:6161/", "Jun13Pt1");
//     n = n + 20_000;
//   }

//   // 2_301_992 -> 2_401_992
//   for (let i = 0; i < 5; i += 1) {
//     void rangeLog(n, n + 20_000, "http://127.0.0.1:6161/", "Jun13Pt2");
//     n = n + 20_000;
//   }

//   // 2_301_992 -> 2_501_992
//   for (let i = 0; i < 5; i += 1) {
//     void rangeLog(n, n + 20_000, "http://127.0.0.1:6161/", "Jun13Pt3");
//     n = n + 20_000;
//   }

//   // 2_501_992 - 2_601_992
//   for (let i = 0; i < 5; i += 1) {
//     void rangeLog(n, n + 20_000, "http://127.0.0.1:6161/", "Jun13Pt4");
//     n = n + 20_000;
//   }

//   // 2_601_992 -> 2_621_992
//   void rangeLog(n, n + 20_000, "http://127.0.0.1:6161/", "Jun13Pt5");

//   // 2_621_992 -> 2_641_992
//   void rangeLog(n, n + 20_000, "http://127.0.0.1:6161/", "Jun13Pt5");

//   // 2_661_992 -> 2671528
//   void rangeLog(2_661_992, 2671528, "http://127.0.0.1:6161/", "Jun13Pt5");

//   // 2_641_992 -> 2_661_992
//   await sleep(10 * 60 * 1_000);
//   await rangeLog(n, n + 20_000, "http://127.0.0.1:6161/", "Jun13Pt5");
// }
