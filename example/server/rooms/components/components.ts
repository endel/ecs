import { Component, Entity } from "@colyseus/ecs";
import { type, Schema, ArraySchema } from "@colyseus/schema";

import { Vector2 } from "../types/Vector2";

export class Movement extends Component {
  @type(Vector2) velocity = new Vector2();
  @type(Vector2) acceleration = new Vector2();
}

export class Circle extends Component {
    @type(Vector2) position = new Vector2();
    @type("number") radius: number;
    @type(Vector2) velocity = new Vector2();
    @type(Vector2) acceleration = new Vector2();
}

export class CanvasContext extends Component {
    @type("number") width: number;
    @type("number") height: number;
}

export class DemoSettings extends Component {
    @type("number") speedMultiplier = 0.001;
}

export class Intersecting extends Component {
    @type(["number"]) points: number[] = [];
}

export class State extends Schema {
    @type([Entity]) entities = new ArraySchema<Entity>();
}