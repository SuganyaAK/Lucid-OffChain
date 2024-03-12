console.log ("Hi")

const x: string[] = ['a', 'b'];
const y: Array<string> = ['a', 'b'];
const j: Array<string | number> = ['a', 1, 'b', 2]; // Union

const a : string[] = ['a','b'];
const b : Array<string> =['a','b'];
const c : Array<number | string> = ['a' ,1,'b', 2];

console.log (c)