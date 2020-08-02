import { Schema, type } from "@colyseus/schema";

export class Vector2 extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }
}