/**
 * 現場データのインターフェース定義
 * 各プロパティの型を厳密に定義
 */
export interface GembaData {
  id: number;
  name: string;
  date: string;
  work: string;
  memo: string;
  waterLevel: number;
  velocity: number;
  area: number;
  flow: string;
  compareNotes: string;
}
